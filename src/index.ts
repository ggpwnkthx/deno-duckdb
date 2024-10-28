// File: src/index.ts
import ffi from "./ffi/index.ts";
import { duckdb_error_type, duckdb_result_type, duckdb_state, duckdb_statement_type, duckdb_type } from "./ffi/types.ts";

type duckdb_database = Deno.PointerObject
type duckdb_connection = Deno.PointerObject
type duckdb_result = Deno.PointerObject

export function duckdb_open(path: string = ":memory:"): duckdb_database {
  const pointer = Deno.UnsafePointer.of(new Uint8Array(8))
  const state = ffi.symbols.duckdb_open(
    Deno.UnsafePointer.of(new TextEncoder().encode(path + "\0")),
    pointer
  )
  console.debug(duckdb_state[state])
  if (!pointer) throw Error(`Failed to open: ${path}`)
  return pointer
}

export function duckdb_close(database: duckdb_database) {
  ffi.symbols.duckdb_close(database)
}

export function duckdb_connect(database: duckdb_database): duckdb_connection {
  const pointer = Deno.UnsafePointer.of(new Uint8Array(8))
  const state = ffi.symbols.duckdb_connect(
    new Deno.UnsafePointerView(database).getBigInt64(),
    pointer
  )
  console.debug(duckdb_state[state])
  if (!pointer) throw Error(`Failed to connect`)
  return pointer
}

export function duckdb_disconnect(connection: duckdb_connection) {
  ffi.symbols.duckdb_disconnect(connection)
}

export function duckdb_library_version(): string {
  const pointer = ffi.symbols.duckdb_library_version()
  return pointer ? new Deno.UnsafePointerView(pointer).getCString() : ""
}

export function duckdb_query(connection: duckdb_connection, query: string): duckdb_result {
  const pointer = Deno.UnsafePointer.of(new Uint8Array(48))
  console.debug({ query })
  const state = ffi.symbols.duckdb_query(
    new Deno.UnsafePointerView(connection).getBigUint64(),
    Deno.UnsafePointer.of(new TextEncoder().encode(query + "\0")),
    pointer
  )
  console.debug(duckdb_state[state])
  if (pointer) {
    if (state === duckdb_state.DuckDBError) {
      const errorType = duckdb_result_error_type(pointer)
      const error = {
        message: errorType !== undefined ? duckdb_error_type[errorType] : `DuckDB error type [${errorType}] is undocumented`,
        options: { cause: duckdb_result_error(pointer) },
      }
      duckdb_destroy_result(pointer);
      throw Error(error.message, error.options)
    }
  }
  if (!pointer) throw Error(`Failed to query`)
  return pointer
}

export function duckdb_destroy_result(result: duckdb_result) {
  ffi.symbols.duckdb_destroy_result(result)
}

export function duckdb_column_name(result: duckdb_result, index: bigint | number): string {
  const pointer = ffi.symbols.duckdb_column_name(result, BigInt(index))
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return Deno.UnsafePointerView.getCString(pointer)
}

export function duckdb_column_type(result: duckdb_result, index: bigint | number ): duckdb_type {
  return ffi.symbols.duckdb_column_type(result, BigInt(index))
}

export function duckdb_result_statement_type(result: duckdb_result): duckdb_statement_type {
  return ffi.symbols.duckdb_result_statement_type(result)
}

export function duckdb_column_logical_type(result: duckdb_result, index: bigint | number): Deno.PointerObject {
  const pointer = ffi.symbols.duckdb_column_logical_type(result, BigInt(index))
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return pointer
}

export function duckdb_column_count(result: duckdb_result): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function duckdb_rows_changed(result: duckdb_result): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function duckdb_result_error(result: duckdb_result): string {
  const pointer = ffi.symbols.duckdb_result_error(result)
  return pointer ? Deno.UnsafePointerView.getCString(pointer) : "No errors"
}

export function duckdb_result_error_type(result: duckdb_result): duckdb_error_type | void {
  const pointer = ffi.symbols.duckdb_result_error_type(result)
  if (pointer) return new Deno.UnsafePointerView(result).getInt32();
}

export function duckdb_result_return_type(result: duckdb_result): duckdb_result_type {
  return ffi.symbols.duckdb_result_return_type(new Deno.UnsafePointerView(result).getBigUint64())
}

export function duckdb_fetch_chunk(result: duckdb_result) {
  return ffi.symbols.duckdb_fetch_chunk(result)
}