// File: src/ffi/index.ts

/**
 * This module is responsible for dynamically loading the DuckDB shared library 
 * using Deno's Foreign Function Interface (FFI).
 * 
 * Deno.dlopen is used to load the DuckDB library at runtime, making it possible to 
 * interact with native functions provided by the library.
 * 
 * The getDuckDBLibraryPath function dynamically determines the path to the DuckDB
 * library, and the symbols object defines the expected functions and their signatures.
 * 
 * @module FFI
 */

import { getDuckDBLibraryPath } from "../fetch.ts";  // Fetches the correct path to the DuckDB shared library
import symbols from "./symbols/index.ts";            // Defines the symbols (functions and their signatures) available in the library

/**
 * Loads the DuckDB shared library dynamically and provides access to its symbols.
 * 
 * - `getDuckDBLibraryPath()` is an asynchronous function that resolves the path
 *   to the DuckDB library.
 * - `symbols` defines the function signatures for the DuckDB library's native functions.
 * 
 * @returns {Deno.DynamicLibrary<any>} A dynamically loaded library with access to the defined symbols.
 */
export default Deno.dlopen(
  await getDuckDBLibraryPath(),  // Path to the DuckDB library, resolved at runtime
  symbols                        // Native function signatures defined in the symbols object
);
