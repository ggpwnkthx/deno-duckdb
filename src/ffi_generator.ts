// src/ffi_generator.ts

import { join } from "https://deno.land/std@0.224.0/path/join.ts";
import { defaultDir, getDuckDBLibraryPath } from "./fetch.ts";

// Run Clang to generate the AST in JSON format
async function generateAST(headerFile: string): Promise<any> {
  const cmd = new Deno.Command("clang", {
    args: ["-Xclang", "-ast-dump=json", "-fsyntax-only", headerFile],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();

  if (code !== 0) {
    const errorMessage = new TextDecoder().decode(stderr);
    console.error("Clang error:", errorMessage);
    Deno.exit(code);
  }

  const astJson = JSON.parse(new TextDecoder().decode(stdout));
  return astJson;
}

// Recursively extract function declarations from the AST
function extractFunctionDeclarations(node: any, functions: any[] = []): any[] {
  if (node.kind === "FunctionDecl") {
    functions.push(node);
  }
  if (node.inner) {
    for (const child of node.inner) {
      extractFunctionDeclarations(child, functions);
    }
  }
  return functions;
}

// Recursively extract type definitions from the AST
function extractTypeDefinitions(node: any, typeMap: Map<string, any> = new Map()): Map<string, any> {
  if (node.kind === "TypedefDecl" && node.name) {
    typeMap.set(node.name, node.type);
  } else if ((node.kind === "RecordDecl" || node.kind === "EnumDecl") && node.name) {
    typeMap.set(node.name, node);
  }

  if (node.inner) {
    for (const child of node.inner) {
      extractTypeDefinitions(child, typeMap);
    }
  }

  return typeMap;
}

function mapCTypeToFFIType(cType: string, typeDefinitions: Map<string, any>, visitedTypes: Set<string> = new Set()): Deno.NativeType {
  // Remove type qualifiers like 'const', 'volatile', 'restrict'
  cType = cType.replace(/\b(const|volatile|restrict)\b/g, "").trim();

  // Handle function pointers (e.g., 'int (*)(int, int)')
  const functionPointerMatch = cType.match(/.+\(\s*\*\s*\)\s*\(.*\)/);
  if (functionPointerMatch) {
    // Map function pointers to 'pointer' (since Deno FFI can't handle function pointers directly)
    return "pointer";
  }

  // Handle arrays (e.g., 'int[10]')
  const arrayMatch = cType.match(/(.+)\s*\[.*\]$/);
  if (arrayMatch) {
    // Treat arrays as pointers to the base type
    cType = arrayMatch[1].trim();
    return "pointer";
  }

  // Handle pointers (e.g., 'int *', 'char **')
  let pointerLevel = 0;
  while (cType.endsWith("*")) {
    pointerLevel++;
    cType = cType.slice(0, -1).trim();
  }

  // Base types mapping
  const baseTypeMap: Record<string, Deno.NativeType> = {
    "void": "void",
    "bool": "bool",
    "char": "u8",
    "signed char": "i8",
    "unsigned char": "u8",
    "short": "i16",
    "short int": "i16",
    "signed short": "i16",
    "signed short int": "i16",
    "unsigned short": "u16",
    "unsigned short int": "u16",
    "int": "i32",
    "signed": "i32",
    "signed int": "i32",
    "unsigned": "u32",
    "unsigned int": "u32",
    "long": "i64",
    "long int": "i64",
    "signed long": "i64",
    "signed long int": "i64",
    "unsigned long": "u64",
    "unsigned long int": "u64",
    "long long": "i64",
    "long long int": "i64",
    "signed long long": "i64",
    "signed long long int": "i64",
    "unsigned long long": "u64",
    "unsigned long long int": "u64",
    "int8_t": "i8",
    "int16_t": "i16",
    "int32_t": "i32",
    "int64_t": "i64",
    "uint8_t": "u8",
    "uint16_t": "u16",
    "uint32_t": "u32",
    "uint64_t": "u64",
    "float": "f32",
    "double": "f64",
    "size_t": "usize",
    "ssize_t": "isize",
    "wchar_t": "i32",
  };

  // Map the base type
  let ffiType = baseTypeMap[cType];

  if (!ffiType) {
    if (visitedTypes.has(cType)) {
      throw new Error(`Circular type reference detected for type '${cType}'`);
    }
    visitedTypes.add(cType);

    // Attempt to resolve the type from typeDefinitions
    const typeDef = typeDefinitions.get(cType);
    if (typeDef) {
      if (typeDef.qualType) {
        // Typedef to another type
        ffiType = mapCTypeToFFIType(typeDef.qualType, typeDefinitions, visitedTypes);
      } else if (typeDef.kind === "EnumDecl") {
        // Enums are typically integers
        ffiType = "i32";
      } else if (typeDef.kind === "RecordDecl") {
        // Structs and unions are mapped to pointers
        ffiType = "pointer";
      } else {
        throw new Error(`Unsupported type definition for '${cType}'`);
      }
    } else {
      // If the type starts with 'struct' or 'union', map to pointer
      if (cType.startsWith("struct") || cType.startsWith("union")) {
        ffiType = "pointer";
      } else {
        throw new Error(`Unknown type '${cType}' and no definition found in AST`);
      }
    }
    visitedTypes.delete(cType);
  }

  // If the type is a pointer, map it accordingly
  while (pointerLevel > 0) {
    ffiType = "pointer";
    pointerLevel--;
  }

  return ffiType;
}

// Helper function to parse the function type string
function parseFunctionType(funcType: string): { returnType: string; parameterTypes: string[] } {
  // Remove leading and trailing whitespace
  funcType = funcType.trim();

  // Find the last occurrence of ')'
  const lastParenIndex = funcType.lastIndexOf(')');

  if (lastParenIndex === -1) {
    throw new Error(`Invalid function type: '${funcType}'`);
  }

  // Split into return type and parameters
  const returnType = funcType.substring(0, funcType.indexOf('(')).trim();
  const paramsString = funcType.substring(funcType.indexOf('(') + 1, lastParenIndex).trim();

  // Handle 'void' parameters
  const parameterTypes = paramsString === 'void' || paramsString === '' ? [] : splitParameters(paramsString);

  return { returnType, parameterTypes };
}

// Helper function to split parameters, considering commas within types
function splitParameters(paramsString: string): string[] {
  const parameterTypes = [];
  let depth = 0;
  let currentParam = '';

  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString[i];

    if (char === ',' && depth === 0) {
      parameterTypes.push(currentParam.trim());
      currentParam = '';
    } else {
      if (char === '(' || char === '<') depth++;
      if (char === ')' || char === '>') depth--;
      currentParam += char;
    }
  }

  if (currentParam) {
    parameterTypes.push(currentParam.trim());
  }

  return parameterTypes;
}

// Generate FFI bindings
function generateFFIBindings(functions: any[], typeDefinitions: Map<string, any>): Record<string, Deno.ForeignFunction> {
  const symbols: Record<string, Deno.ForeignFunction> = {};
  for (const func of functions) {
    try {
      const funcName = func.name;

      // Parse the function type to get return type and parameter types
      const { returnType, parameterTypes } = parseFunctionType(func.type.qualType);

      const ffiReturnType = mapCTypeToFFIType(returnType, typeDefinitions);
      const ffiParameterTypes = parameterTypes.map((p) => mapCTypeToFFIType(p, typeDefinitions));

      symbols[funcName] = {
        name: funcName,
        parameters: ffiParameterTypes,
        result: ffiReturnType,
        nonblocking: false, // Set to true if the function is non-blocking
      };
    } catch (error) {
      console.warn(`Skipping function ${func.name}: ${(error as Error).message}`);
    }
  }
  return symbols;
}

// Main function to generate and cache ffiSymbols
export async function generate() {
  await getDuckDBLibraryPath()
  const ast = await generateAST(join(defaultDir, "duckdb.h"));
  const typeDefinitions = extractTypeDefinitions(ast);
  const functions = extractFunctionDeclarations(ast);
  const ffiSymbols = generateFFIBindings(functions, typeDefinitions);
  await Deno.writeTextFile(join(defaultDir, "symbols.json"), JSON.stringify(ffiSymbols, null, 2));
}