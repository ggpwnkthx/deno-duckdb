import { CHAR_0 } from "https://deno.land/std@0.224.0/path/_common/constants.ts";
import { duckdb_result_type, duckdb_statement_type, duckdb_type } from "./src/ffi/types.ts";
import { duckdb_close, duckdb_column_count, duckdb_column_logical_type, duckdb_column_name, duckdb_column_type, duckdb_connect, duckdb_destroy_result, duckdb_disconnect, duckdb_fetch_chunk, duckdb_open, duckdb_query, duckdb_result_return_type, duckdb_result_statement_type } from "./src/index.ts";

function* bigintRange(start: bigint, end: bigint): Generator<bigint, void, unknown> {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

const db = duckdb_open()
if (db) {
  console.debug({ db_ptr: new Deno.UnsafePointerView(db).getBigUint64() })
  const conn = duckdb_connect(db)
  if (conn) {
    console.debug({ conn_ptr: new Deno.UnsafePointerView(conn).getBigUint64() })
    const result = duckdb_query(conn, "PRAGMA version")
    if (result) {
      const resultView = new DataView(new Deno.UnsafePointerView(result).getArrayBuffer(1024))
      const column_count = duckdb_column_count(result)
      console.debug({ result: {
        // deprecated_column_count: resultView.getBigUint64(0, true),
        // deprecated_row_count: resultView.getBigUint64(8, true),
        // deprecated_rows_changed: resultView.getBigUint64(16, true),
        // deprecated_columns: resultView.getBigUint64(24, true),
        // deprecated_error_message_ptr: resultView.getBigUint64(32, true),
        internal_data_ptr: resultView.getBigUint64(40, true),
        statement_type: duckdb_result_statement_type(result),
        result_type: duckdb_result_return_type(result),
        column_names: [...bigintRange(0n, column_count)].map(i => duckdb_column_name(result, i)),
        column_types: [...bigintRange(0n, column_count)].map(i => duckdb_type[duckdb_column_type(result, i)]),
      } })
      const data_chunk = duckdb_fetch_chunk(result)
      console.debug({data_chunk})
      duckdb_destroy_result(result)
      console.debug({ result: new Deno.UnsafePointerView(result).getBigUint64() })
    }
    duckdb_disconnect(conn)
    console.debug({ conn_ptr: new Deno.UnsafePointerView(conn).getBigUint64() })
  }
  duckdb_close(db)
  console.debug({ db_ptr: new Deno.UnsafePointerView(db).getBigUint64() })
}