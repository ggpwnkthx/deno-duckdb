// File: src/ast/index.ts

import type { ASTNode, ExtractCallback, NodeExtractor, NodeMap } from "./types.ts";

/**
 * Reusable TextDecoder instance.
 */
const decoder = new TextDecoder("utf-8");

/**
 * Executes the clang command to generate the AST in JSON format.
 * @param filePath - The path to the source file.
 * @param clangArgs - Additional clang arguments.
 * @returns A promise that resolves to the ASTNode.
 * @throws Will throw an error if clang fails or JSON parsing fails.
 */
export async function getAST(
  filePath: string,
  clangArgs: string[] = ["-Xclang", "-ast-dump=json", "-fsyntax-only", "-fno-elide-type",]
): Promise<ASTNode> {
  try {
    // Initialize the clang command with necessary arguments
    const command = new Deno.Command("clang", {
      args: [...clangArgs, filePath],
      stdout: "piped",
      stderr: "piped",
    });

    // Execute the command and capture output
    const { code, stdout, stderr } = await command.output();

    // If the command failed, throw an error with stderr details
    if (code !== 0) {
      const errorString = decoder.decode(stderr).trim();
      throw new Error(`Clang failed with exit code ${code}:\n${errorString}`);
    }

    // Decode and parse the JSON AST
    const stdoutString = decoder.decode(stdout);
    let astJson: ASTNode;
    try {
      astJson = JSON.parse(stdoutString);
    } catch (parseError) {
      throw new Error(`Failed to parse AST JSON: ${(parseError as Error).message}`);
    }

    return astJson;
  } catch (error) {
    console.error(
      "Failed to get AST JSON:",
      error instanceof Error ? error.message : error
    );
    throw error; // Re-throw to allow upstream handling
  }
}

/**
 * Asynchronously traverses the AST tree and yields each node.
 * @param root - The root ASTNode to start traversal from.
 */
export async function* traverseNode(root: ASTNode): AsyncGenerator<ASTNode> {
  const stack: ASTNode[] = [root];

  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    yield currentNode;

    // Ensure 'inner' is an array before traversing
    if (Array.isArray(currentNode.inner)) {
      // Push children to the stack in reverse order to maintain traversal order
      for (let i = currentNode.inner.length - 1; i >= 0; i--) {
        stack.push(currentNode.inner[i]);
      }
    }
  }
}

/**
 * Extracts nodes from the AST based on filter and extractor functions.
 * @param root - The root ASTNode to start extraction from.
 * @param filter - A callback to determine if a node should be extracted.
 * @param extractor - A function to extract the desired information from a node.
 * @param map - An optional NodeMap to populate with extracted nodes.
 * @returns A promise that resolves to a NodeMap containing the extracted nodes.
 */
export async function extractNodes<T>(
  root: ASTNode,
  filter: ExtractCallback,
  extractor: NodeExtractor<T>,
  map: NodeMap<T> = new Map()
): Promise<NodeMap<T>> {
  for await (const node of traverseNode(root)) {
    if (filter(node) && node.name) {
      map.set(node.name, extractor(node));
    }
  }
  return map;
}
