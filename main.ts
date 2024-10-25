import { duckdb_close, duckdb_connect, duckdb_destroy_result, duckdb_disconnect, duckdb_fetch_chunk, duckdb_open, duckdb_query, duckdb_result_return_type, duckdb_result_statement_type } from "./src/index.ts";

const db = duckdb_open()
if (db) {
  console.debug({ db_ptr: new Deno.UnsafePointerView(db).getBigUint64() })
  const conn = duckdb_connect(db)
  if (conn) {
    console.debug({ conn_ptr: new Deno.UnsafePointerView(conn).getBigUint64() })
    const result = duckdb_query(conn, "SELECT 42;")
    if (result) {
      const resultView = new DataView(new Deno.UnsafePointerView(result).getArrayBuffer(1024))
      console.debug({ result: {
        // deprecated_column_count: resultView.getBigUint64(0, true),
        // deprecated_row_count: resultView.getBigUint64(8, true),
        // deprecated_rows_changed: resultView.getBigUint64(16, true),
        // deprecated_columns: resultView.getBigUint64(24, true),
        // deprecated_error_message_ptr: resultView.getBigUint64(32, true),
        internal_data_ptr: resultView.getBigUint64(40, true),
      } })
      const statement_type = duckdb_result_statement_type(result)
      if (statement_type !== null) {
        console.debug({ statement_type })
      }
      const result_type = duckdb_result_return_type(result)
      if (result_type !== null) {
        console.debug({ result_type })
      }
      const data_chunk = duckdb_fetch_chunk(result)
      if (data_chunk !== null){
        console.debug({data_chunk})
      }
      duckdb_destroy_result(result)
      console.debug({ result: new Deno.UnsafePointerView(result).getBigUint64() })
    }
    duckdb_disconnect(conn)
    console.debug({ conn_ptr: new Deno.UnsafePointerView(conn).getBigUint64() })
  }
  duckdb_close(db)
  console.debug({ db_ptr: new Deno.UnsafePointerView(db).getBigUint64() })
}