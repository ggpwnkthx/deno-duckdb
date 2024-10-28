import { duckdb_statement_type, duckdb_type } from "./src/ffi/types.ts";
import { duckdb_close, duckdb_column_count, duckdb_column_name, duckdb_column_type, duckdb_connect, duckdb_destroy_result, duckdb_disconnect, duckdb_fetch_chunk, duckdb_library_version, duckdb_open, duckdb_query, duckdb_result_return_type, duckdb_result_statement_type } from "./src/index.ts";

console.debug(duckdb_library_version())
const db = duckdb_open("duck.db")
if (db) {
  console.debug({ db: new Deno.UnsafePointerView(db).getArrayBuffer(8) })
  const conn = duckdb_connect(db)
  if (conn) {
    console.debug({ conn: new Deno.UnsafePointerView(conn).getArrayBuffer(8) })
    let result = duckdb_query(conn, "PRAGMA version")
    if (result) {
      const resultBuffer = new Deno.UnsafePointerView(result).getArrayBuffer(48)
      const column_count = Number(duckdb_column_count(result)) // Number.MAX_SAFE_INTEGER
      console.debug({
        result: {
          // deprecated_column_count: resultBuffer.slice(0, 8),
          // deprecated_row_count: resultBuffer.slice(8, 16),
          // deprecated_rows_changed: resultBuffer.slice(16, 24),
          // deprecated_columns: resultBuffer.slice(24, 32),
          // deprecated_error_message_ptr: resultBuffer.slice(32, 40),
          internal_data_ptr: resultBuffer.slice(40),
          statement_type: duckdb_statement_type[duckdb_result_statement_type(result)],
          result_type: duckdb_type[duckdb_result_return_type(result)],
          column_names: Array.from({ length: column_count }).map((_, i) => duckdb_column_name(result, i)),
          column_types: Array.from({ length: column_count }).map((_, i) => duckdb_type[duckdb_column_type(result, i)]),
        }
      })
      const data_chunk = duckdb_fetch_chunk(result)
      console.debug({ data_chunk })
      duckdb_destroy_result(result)
      console.debug({ result: new Deno.UnsafePointerView(result).getArrayBuffer(8) })
    }

    // ERROR HANDLING EXAMPLE
    try {
      result = duckdb_query(conn, "PRAGMA version,,;")
      if (result) {
        duckdb_destroy_result(result)
        console.debug({ result: new Deno.UnsafePointerView(result).getArrayBuffer(8) })
      }
    } catch (error) {
      console.error(error);
    }
    duckdb_disconnect(conn)
    console.debug({ conn: new Deno.UnsafePointerView(conn).getArrayBuffer(8) })
  }
  duckdb_close(db)
  console.debug({ db: new Deno.UnsafePointerView(db).getArrayBuffer(8) })
}