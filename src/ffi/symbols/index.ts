// File: src/ffi/symbols/index.ts

/**
 * This module exports all the symbols (native functions) used in DuckDB's Foreign 
 * Function Interface (FFI). Each symbol represents a set of native functions that are 
 * dynamically loaded and accessed via Deno's FFI.
 * 
 * The individual files like `open_connect.ts`, `configuration.ts`, etc., export different
 * sets of function signatures that correspond to various DuckDB operations, such as 
 * connecting to the database, executing queries, and handling results.
 * 
 * These symbols are spread into a single export object, making them accessible through
 * this module.
 */

import open_connect from "./open_connect.ts";                     // Symbols related to opening connections
import configuration from "./configuration.ts";                   // Symbols for configuration functions
import query_execution from "./query_execution.ts";               // Symbols for query execution functions
import result from "./result.ts";                                 // Symbols for result processing functions
// import helpers from "./helpers/index.ts";                         // Helper functions related to FFI
// import prepared_statements from "./prepared_statements/index.ts"; // Symbols for prepared statements
import interfaces from "./interfaces/index.ts";                   // Symbols for various DuckDB interfaces
import validity_mask from "./validity_mask.ts";                   // Symbols for managing validity masks
// import scalar from "./scalar.ts";                                 // Symbols for scalar functions
// import aggregate from "./aggregate.ts";                           // Symbols for aggregate functions
// import table from "./table/index.ts";                             // Symbols for table-related functions
// import replacement_scans from "./replacement_scans.ts";           // Symbols for handling replacement scans
// import profiling_info from "./profiling_info.ts";                 // Symbols for profiling information
// import appender from "./appender.ts";                             // Symbols for appending data to tables
// import threading from "./threading.ts";                           // Symbols related to threaded tasks
// import cast from "./cast.ts"                                      // Symbols related to casting to different types

/**
 * The default export is an object that merges all the imported symbol sets. 
 * These symbols define native functions that can be called via FFI.
 * 
 * By spreading the contents of each module (e.g., `open_connect`, `configuration`, etc.),
 * this export consolidates all DuckDB-related FFI symbols into a single object for ease
 * of use.
 */
export default {
  ...open_connect,
  ...configuration,
  ...query_execution,
  ...result,
  // ...helpers,
  // ...prepared_statements,
  ...interfaces,
  ...validity_mask,
  // ...scalar,
  // ...aggregate,
  // ...table,
  // ...replacement_scans,
  // ...profiling_info,
  // ...appender,
  // ...threading,
  // ...cast
} as const satisfies Deno.ForeignLibraryInterface;
