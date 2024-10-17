// File: src/ast/typedefs.ts

import { extractNodes } from "./index.ts";
import type { ASTNode, ExtractCallback, NodeExtractor } from "./types.ts";

/**
 * Represents a Typedef Declaration extracted from the AST.
 */
export interface TypedefDeclaration {
  /** The name of the typedef. */
  name: string;
  /** The underlying type that the typedef refers to. */
  underlyingType: string;
}

/**
 * Represents a Typedef Declaration AST node with required properties.
 */
interface TypedefDeclNode extends ASTNode {
  kind: "TypedefDecl";
  name: string;
  type: {
    qualType: string;
  };
}

/**
 * Type guard to check if a node is a TypedefDeclNode.
 * @param node - The AST node to check.
 * @returns `true` if the node is a TypedefDeclNode; otherwise, `false`.
 */
function isTypedefDeclNode(node: ASTNode): node is TypedefDeclNode {
  return node.kind === "TypedefDecl" && typeof node.name === "string" && node.type?.qualType !== undefined;
}

/**
 * Extracts Typedef Declarations from the given AST.
 * @param ast - The root ASTNode to extract typedef declarations from.
 * @returns A promise that resolves to an array of TypedefDeclaration objects.
 */
export async function extractTypedefDeclarations(ast: ASTNode): Promise<TypedefDeclaration[]> {
  /**
   * Callback to filter nodes of kind TypedefDecl.
   * @param node - The AST node to evaluate.
   * @returns `true` if the node is a TypedefDecl; otherwise, `false`.
   */
  const typedefFilter: ExtractCallback = (node) => node.kind === "TypedefDecl";

  /**
   * Extractor function to transform a TypedefDecl node into a TypedefDeclaration object.
   * @param node - The TypedefDecl AST node to extract information from.
   * @returns A TypedefDeclaration object or null if extraction fails.
   */
  const typedefExtractor: NodeExtractor<TypedefDeclaration | null> = (node) => {
    if (!isTypedefDeclNode(node)) {
      console.warn(`Invalid TypedefDecl node:`, node);
      return null;
    }

    return {
      name: node.name,
      underlyingType: node.type.qualType,
    };
  };

  // Extract typedef nodes using the defined filter and extractor
  const typedefMap = await extractNodes(ast, typedefFilter, typedefExtractor);

  // Convert the Map of TypedefDeclarations to an array, filtering out any nulls
  return Array.from(typedefMap.values()).filter(
    (typedef): typedef is TypedefDeclaration => typedef !== null
  );
}
