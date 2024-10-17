// File: src/ast/enums.ts

import { extractNodes } from "./index.ts";
import type { ASTNode, ExtractCallback, NodeExtractor } from "./types.ts";

/**
 * Represents a single constant within an enum.
 */
export interface EnumConstant {
  /** The name of the enum constant. */
  name: string;
  /** The numerical value of the enum constant. */
  value: number;
}

/**
 * Represents an enum declaration extracted from the AST.
 */
export interface EnumDeclaration {
  /** The name of the enum. */
  name: string;
  /** An array of constants within the enum. */
  constants: EnumConstant[];
}

/**
 * Represents an Enum Declaration AST node with required properties.
 */
interface EnumDeclNode extends ASTNode {
  kind: "EnumDecl";
  name: string;
  inner?: readonly ASTNode[];
}

/**
 * Represents an Enum Constant Declaration AST node with required properties.
 */
interface EnumConstantDeclNode extends ASTNode {
  kind: "EnumConstantDecl";
  name: string;
  value?: string;
}

/**
 * Type guard to check if a node is an EnumDeclNode.
 * @param node - The AST node to check.
 * @returns `true` if the node is an EnumDeclNode; otherwise, `false`.
 */
function isEnumDeclNode(node: ASTNode): node is EnumDeclNode {
  return node.kind === "EnumDecl" && typeof node.name === "string";
}

/**
 * Type guard to check if a node is an EnumConstantDeclNode.
 * @param node - The AST node to check.
 * @returns `true` if the node is an EnumConstantDeclNode; otherwise, `false`.
 */
function isEnumConstantDeclNode(node: ASTNode): node is EnumConstantDeclNode {
  return node.kind === "EnumConstantDecl" && typeof node.name === "string";
}

/**
 * Extracts Enum Declarations from the given AST.
 * @param ast - The root ASTNode to extract enum declarations from.
 * @param options - Optional parameters for default values.
 * @returns A promise that resolves to an array of EnumDeclaration objects.
 */
export async function extractEnumDeclarations(
  ast: ASTNode,
  options?: { defaultConstantValue?: number }
): Promise<EnumDeclaration[]> {
  const { defaultConstantValue = 0 } = options || {};

  /**
   * Callback to filter nodes of kind EnumDecl.
   * @param node - The AST node to evaluate.
   * @returns `true` if the node is an EnumDecl; otherwise, `false`.
   */
  const enumFilter: ExtractCallback = (node) => node.kind === "EnumDecl";

  /**
   * Extractor function to transform an EnumDecl node into an EnumDeclaration object.
   * @param node - The EnumDecl AST node to extract information from.
   * @returns An EnumDeclaration object or null if extraction fails.
   */
  const enumExtractor: NodeExtractor<EnumDeclaration | null> = (node) => {
    if (!isEnumDeclNode(node)) {
      console.warn(`Invalid EnumDecl node:`, node);
      return null;
    }

    const constants: EnumConstant[] = [];
    let currentValue = defaultConstantValue;

    if (node.inner) {
      for (const child of node.inner) {
        if (isEnumConstantDeclNode(child)) {
          let constantValue: number;

          if (child.value !== undefined) {
            // Attempt to parse the value; support decimal and hexadecimal
            const parsedValue = parseInt(child.value, 0); // The radix 0 allows for automatic radix detection
            if (isNaN(parsedValue)) {
              console.warn(
                `Failed to parse value for EnumConstantDecl node '${child.name}':`,
                child.value
              );
              constantValue = currentValue;
            } else {
              constantValue = parsedValue;
              currentValue = constantValue + 1; // Increment for the next implicit value
            }
          } else {
            // Assign the current value and increment
            constantValue = currentValue;
            currentValue += 1;
          }

          constants.push({
            name: child.name,
            value: constantValue,
          });
        }
      }
    } else {
      console.warn(`EnumDecl node '${node.name}' has no inner nodes.`);
    }

    return {
      name: node.name,
      constants,
    };
  };

  // Extract enum nodes using the defined filter and extractor
  const enumMap = await extractNodes(ast, enumFilter, enumExtractor);

  // Convert the Map of EnumDeclarations to an array, filtering out any nulls
  return Array.from(enumMap.values()).filter(
    (enumDecl): enumDecl is EnumDeclaration => enumDecl !== null
  );
}
