// File: src/ast/records.ts

import { extractNodes } from "./index.ts";
import type { ASTNode, ExtractCallback, NodeExtractor } from "./types.ts";

/**
 * Represents a single field within a record.
 */
export interface RecordField {
  /** The name of the field. */
  name: string;
  /** The type of the field as a string. */
  type: string;
}

/**
 * Represents a record declaration extracted from the AST.
 */
export interface RecordDeclaration {
  /** The name of the record. */
  name: string;
  /** An array of fields within the record. */
  fields: RecordField[];
}

/**
 * Represents a Record Declaration AST node with required properties.
 */
interface RecordDeclNode extends ASTNode {
  kind: "RecordDecl";
  name: string;
  inner?: readonly ASTNode[];
}

/**
 * Represents a Field Declaration AST node with required properties.
 */
interface FieldDeclNode extends ASTNode {
  kind: "FieldDecl";
  name: string;
  type: {
    qualType: string;
  };
}

/**
 * Type guard to check if a node is a RecordDeclNode.
 * @param node - The AST node to check.
 * @returns `true` if the node is a RecordDeclNode; otherwise, `false`.
 */
function isRecordDeclNode(node: ASTNode): node is RecordDeclNode {
  return node.kind === "RecordDecl" && typeof node.name === "string";
}

/**
 * Type guard to check if a node is a FieldDeclNode.
 * @param node - The AST node to check.
 * @returns `true` if the node is a FieldDeclNode; otherwise, `false`.
 */
function isFieldDeclNode(node: ASTNode): node is FieldDeclNode {
  return (
    node.kind === "FieldDecl" &&
    typeof node.name === "string" &&
    typeof node.type?.qualType === "string"
  );
}

/**
 * Extracts Record Declarations from the given AST.
 * @param ast - The root ASTNode to extract record declarations from.
 * @returns A promise that resolves to an array of RecordDeclaration objects.
 */
export async function extractRecordDeclarations(
  ast: ASTNode
): Promise<RecordDeclaration[]> {
  /**
   * Callback to filter nodes of kind RecordDecl.
   * @param node - The AST node to evaluate.
   * @returns `true` if the node is a RecordDecl; otherwise, `false`.
   */
  const recordFilter: ExtractCallback = (node) => node.kind === "RecordDecl";

  /**
   * Extractor function to transform a RecordDecl node into a RecordDeclaration object.
   * @param node - The RecordDecl AST node to extract information from.
   * @returns A RecordDeclaration object or null if extraction fails.
   */
  const recordExtractor: NodeExtractor<RecordDeclaration | null> = (node) => {
    if (!isRecordDeclNode(node)) {
      console.warn(`Invalid RecordDecl node:`, node);
      return null;
    }

    const fields: RecordField[] = [];

    if (node.inner) {
      for (const child of node.inner) {
        if (isFieldDeclNode(child)) {
          fields.push({
            name: child.name,
            type: child.type.qualType,
          });
        } else {
          console.warn(
            `Encountered non-FieldDecl node within RecordDecl '${node.name}':`,
            child
          );
        }
      }
    } else {
      console.warn(`RecordDecl node '${node.name}' has no inner nodes.`);
    }

    return {
      name: node.name,
      fields,
    };
  };

  // Extract record nodes using the defined filter and extractor
  const recordMap = await extractNodes(ast, recordFilter, recordExtractor);

  // Convert the Map of RecordDeclarations to an array, filtering out any nulls
  return Array.from(recordMap.values()).filter(
    (recordDecl): recordDecl is RecordDeclaration => recordDecl !== null
  );
}
