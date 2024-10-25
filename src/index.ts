// File: src/index.ts
import ffi from "./ffi/index.ts";
import { duckdb_error_type, duckdb_result_type, duckdb_state, duckdb_statement_type, duckdb_type } from "./ffi/types.ts";

export function duckdb_open(path: string = ":memory:"): Deno.PointerObject<bigint> | void {
  const pointer = Deno.UnsafePointer.of<bigint>(new Uint8Array(8))
  const state = ffi.symbols.duckdb_open(
    Deno.UnsafePointer.of(new TextEncoder().encode(path + "\0")),
    pointer
  )
  console.debug(duckdb_state[state])
  if (pointer) return pointer
}

export function duckdb_close(database: Deno.PointerObject<bigint>) {
  ffi.symbols.duckdb_close(database)
}

export function duckdb_connect(database: Deno.PointerObject<bigint>): Deno.PointerObject<bigint> | void {
  const pointer = Deno.UnsafePointer.of<bigint>(new Uint8Array(8))
  const state = ffi.symbols.duckdb_connect(
    new Deno.UnsafePointerView(database).getBigUint64(),
    pointer
  )
  console.debug(duckdb_state[state])
  if (pointer) return pointer
}

export function duckdb_disconnect(connection: Deno.PointerObject<bigint>) {
  ffi.symbols.duckdb_disconnect(connection)
}

export function duckdb_query(connection: Deno.PointerObject<bigint>, query: string): Deno.PointerObject | void {
  const result = Deno.UnsafePointer.of(new Uint8Array(48))
  console.debug({ query })
  const state = ffi.symbols.duckdb_query(
    new Deno.UnsafePointerView(connection).getBigUint64(),
    Deno.UnsafePointer.of(new TextEncoder().encode(query + "\0")),
    result
  )
  console.debug(duckdb_state[state])
  if (result) {
    if (state === duckdb_state.DuckDBError) {
      const errorType = duckdb_result_error_type(result)
      const error = {
        message: errorType !== undefined ? duckdb_error_type[errorType] : `DuckDB error type [${errorType}] is undocumented`,
        options: { cause: duckdb_result_error(result) },
      }
      console.error(error);
      duckdb_destroy_result(result);
      throw Error(error.message, error.options)
    }
    return result
  }
}

export function duckdb_destroy_result(result: Deno.PointerObject) {
  ffi.symbols.duckdb_destroy_result(result)
}

export function duckdb_column_name(result: Deno.PointerObject, index: bigint): string {
  const pointer = ffi.symbols.duckdb_column_name(result, index)
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return Deno.UnsafePointerView.getCString(pointer)
}

export function duckdb_column_type(result: Deno.PointerObject, index: bigint): duckdb_type {
  return ffi.symbols.duckdb_column_type(result, index)
}

export function duckdb_result_statement_type(result: Deno.PointerObject): duckdb_statement_type {
  return ffi.symbols.duckdb_result_statement_type(result)
}

export function duckdb_column_logical_type(result: Deno.PointerObject, index: bigint): Deno.PointerObject {
  const pointer = ffi.symbols.duckdb_column_logical_type(result, index)
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return pointer
}

export function duckdb_column_count(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function duckdb_rows_changed(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function duckdb_result_error(result: Deno.PointerObject): string {
  const pointer = ffi.symbols.duckdb_result_error(result)
  return pointer ? Deno.UnsafePointerView.getCString(pointer) : "No errors"
}

export function duckdb_result_error_type(result: Deno.PointerObject): duckdb_error_type | void {
  const pointer = ffi.symbols.duckdb_result_error_type(result)
  if (pointer) return new Deno.UnsafePointerView(result).getInt32();
}

export function duckdb_result_return_type(result: Deno.PointerObject): duckdb_result_type {
  return ffi.symbols.duckdb_result_return_type(result)
}

export function duckdb_fetch_chunk(result: Deno.PointerObject) {
  return ffi.symbols.duckdb_fetch_chunk(new Deno.UnsafePointerView(result).getBigUint64())
}