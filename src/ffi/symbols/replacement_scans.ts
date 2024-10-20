//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/replacement_scans.ts
// Replacement Scans
//===--------------------------------------------------------------------===//

export default {
  // Adds a replacement scan definition to the specified database.
  // A replacement scan allows users to override or customize how table scans are performed.
  //
  // @param db A pointer to the `duckdb_database` object where the replacement scan will be added.
  // @param replacement A callback function (`duckdb_replacement_callback_t`) that defines the replacement scan behavior.
  // @param extra_data A pointer to any extra data that should be passed into the callback.
  // @param delete_callback A callback that will be called to delete the `extra_data` when it is no longer needed.
  // @return void
  duckdb_add_replacement_scan: {
    parameters: ["pointer", "pointer", "pointer", "pointer"] as const,  // duckdb_database, duckdb_replacement_callback_t, void*, duckdb_delete_callback_t
    result: "void" as const,                                            // void
  },

  // Sets the function name for the replacement scan.
  // This function must be called within the replacement callback to actually perform the replacement scan.
  // If it is not called, the scan will proceed normally, without replacement.
  //
  // @param info A pointer to the `duckdb_replacement_scan_info` object.
  // @param function_name A pointer to the null-terminated string representing the name of the function to substitute.
  // @return void
  duckdb_replacement_scan_set_function_name: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_replacement_scan_info, const char* (function name)
    result: "void" as const,                      // void
  },

  // Adds a parameter to the replacement scan function.
  // Parameters allow you to pass values that will be used in the replacement scan logic.
  //
  // @param info A pointer to the `duckdb_replacement_scan_info` object.
  // @param parameter A `duckdb_value` representing the parameter to add.
  // @return void
  duckdb_replacement_scan_add_parameter: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_replacement_scan_info, duckdb_value
    result: "void" as const,                      // void
  },

  // Reports an error that occurred while executing the replacement scan.
  // The error message can be logged or displayed to help diagnose issues with the replacement scan.
  //
  // @param info A pointer to the `duckdb_replacement_scan_info` object.
  // @param error A pointer to the null-terminated string representing the error message.
  // @return void
  duckdb_replacement_scan_set_error: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_replacement_scan_info, const char* (error message)
    result: "void" as const,                      // void
  },
};
