// File: src/ast/types.ts

/**
 * Represents the different kinds of AST nodes.
 * Extend this union type as needed to include all relevant kinds.
 */
export type ASTNodeKind =
  | "TranslationUnit"
  | "FunctionDecl"
  | "VariableDecl"
  | "TypedefDecl"
  | "EnumDecl"
  | "EnumConstantDecl"
  | "RecordDecl"
  | "FieldDecl";

/**
 * Represents the type information of an AST node.
 */
export interface ASTType {
  /** The qualified type as a string, e.g., "int", "float", "MyClass *" */
  qualType: string;
  /** Pointer level, e.g., 0 for non-pointers, 1 for single pointer */
  pointerLevel?: number;
  /** Indicates if the type is const */
  isConst?: boolean;
  /** Additional type-related metadata */
  metadata?: Readonly<Record<string, any>>;
}

/**
 * Base interface for all AST nodes.
 */
export interface ASTNode {
  /** The kind of the AST node, e.g., FunctionDecl, VariableDecl */
  kind: ASTNodeKind;
  /** The name associated with the node, if applicable */
  name?: string;
  /** The value of the node, if applicable */
  value?: string;
  /** The type information of the node, if applicable */
  type?: ASTType;
  /** Child nodes of the current AST node */
  inner?: readonly ASTNode[];
}

/**
 * Specific AST node interfaces can be defined here...
 */

/**
 * A callback function that determines whether a given AST node should be extracted.
 * @param node - The AST node to evaluate.
 * @returns `true` if the node meets the criteria for extraction; otherwise, `false`.
 */
export type ExtractCallback = (node: ASTNode) => boolean;

/**
 * A function that extracts specific information from an AST node.
 * @param node - The AST node to extract information from.
 * @returns The extracted information of type `T`.
 */
export type NodeExtractor<T> = (node: ASTNode) => T;

/**
 * A map that associates node names with their extracted information.
 */
export type NodeMap<T> = Map<string, T>;
