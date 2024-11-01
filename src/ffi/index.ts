// File: src/ffi/index.ts

/**
 * This module is responsible for dynamically loading the DuckDB shared library 
 * using Deno's Foreign Function Interface (FFI).
 * 
 * Deno.dlopen is used to load the DuckDB library at runtime, making it possible to 
 * interact with native functions provided by the library.
 * 
 * @module FFI
 */

import { getDuckDBLibraryPath } from "../fetch.ts";  // Fetches the correct path to the DuckDB shared library
import symbols from "./symbols/index.ts";            // Defines the symbols (functions and their signatures) available in the library

/**
 * Loads the DuckDB shared library dynamically and provides access to its symbols.
 * 
 * @returns {Deno.DynamicLibrary<any>} A dynamically loaded library with access to the defined symbols.
 */
export const ffi = Deno.dlopen(
  await getDuckDBLibraryPath(),  // Path to the DuckDB library, resolved at runtime
  symbols       // Native function signatures defined in the symbols object
);