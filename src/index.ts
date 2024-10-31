// File: src/index.ts
import ffi from "./ffi/index.ts";
import { duckdb_error_type, duckdb_result_type, duckdb_state, duckdb_statement_type, duckdb_type } from "./ffi/enums.ts";

export function duckdb_open(path: string = ":memory:"): Deno.PointerObject {
  const pointer = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const state = ffi.symbols.duckdb_open(
    new TextEncoder().encode(path + "\0"),
    pointer
  )
  console.debug(duckdb_state[state])
  if (!pointer) throw Error(`Failed to open: ${path}`)
  return pointer
}

export function duckdb_close(database: Deno.PointerObject) {
  ffi.symbols.duckdb_close(database)
}

export function duckdb_connect(database: Deno.PointerObject): Deno.PointerObject {
  const pointer = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const state = ffi.symbols.duckdb_connect(
    Deno.UnsafePointerView.getArrayBuffer(database, 8),
    pointer
  )
  console.debug(duckdb_state[state])
  if (!pointer) throw Error(`Failed to connect`)
  return pointer
}

export function duckdb_disconnect(connection: Deno.PointerObject) {
  ffi.symbols.duckdb_disconnect(connection)
}

export function duckdb_library_version(): string {
  const pointer = ffi.symbols.duckdb_library_version()
  return pointer ? new Deno.UnsafePointerView(pointer).getCString() : ""
}

export function duckdb_query(connection: Deno.PointerObject, query: string) {
  const pointer = Deno.UnsafePointer.of(new ArrayBuffer(48))
  console.debug({ query })
  const state = ffi.symbols.duckdb_query(
    Deno.UnsafePointerView.getArrayBuffer(connection, 8),
    Deno.UnsafePointer.of(new TextEncoder().encode(query + "\0")),
    pointer
  )
  console.debug(duckdb_state[state])
  if (pointer) {
    if (state === duckdb_state.DuckDBError) {
      const errorType = duckdb_result_error_type(pointer)
      const error = {
        message: errorType ?? `DuckDB error type [${errorType}] is undocumented`,
        options: { cause: duckdb_result_error(pointer) },
      }
      duckdb_destroy_result(pointer);
      throw Error(error.message, error.options)
    }
  }
  if (!pointer) throw Error(`Failed to query`)
  return pointer
}

export function duckdb_destroy_result(result: Deno.PointerObject) {
  ffi.symbols.duckdb_destroy_result(result)
}

export function duckdb_column_name(result: Deno.PointerObject, index: bigint | number): string {
  const pointer = ffi.symbols.duckdb_column_name(result, BigInt(index))
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return Deno.UnsafePointerView.getCString(pointer)
}

export function duckdb_column_type(result: Deno.PointerObject, index: bigint | number): string | void {
  return duckdb_type[ffi.symbols.duckdb_column_type(result, BigInt(index))]
}

export function duckdb_result_statement_type(result: Deno.PointerObject): string | void {
  return duckdb_statement_type[ffi.symbols.duckdb_result_statement_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))]
}

export function duckdb_column_logical_type(result: Deno.PointerObject, index: bigint | number): ArrayBuffer {
  const pointer = ffi.symbols.duckdb_column_logical_type(result, BigInt(index))
  if (pointer === null) throw new Error("Column not found. Index value may be invalid.");
  return pointer
}

export function duckdb_column_count(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function duckdb_rows_changed(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_rows_changed(result)
}

export function duckdb_result_error(result: Deno.PointerObject): string {
  const pointer = ffi.symbols.duckdb_result_error(result)
  return pointer ? Deno.UnsafePointerView.getCString(pointer) : "No errors"
}

export function duckdb_result_error_type(result: Deno.PointerObject): string | void {
  const type = ffi.symbols.duckdb_result_error_type(result)
  if (type) return duckdb_error_type[type];
}

export function duckdb_result_return_type(result: Deno.PointerObject): string | void {
  const type = ffi.symbols.duckdb_result_return_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  return duckdb_result_type[type]
}

export function duckdb_fetch_chunk(result: Deno.PointerObject) {
  const buffer = ffi.symbols.duckdb_fetch_chunk(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  if (buffer.every(b => b === 0)) return null
  return buffer
}

export function duckdb_data_chunk_get_column_count(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_data_chunk_get_column_count(chunk)
}

export function duckdb_data_chunk_get_vector(chunk: ArrayBuffer, column_index: bigint | number) {
  return ffi.symbols.duckdb_data_chunk_get_vector(chunk, BigInt(column_index))
}

export function duckdb_data_chunk_get_size(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_data_chunk_get_size(chunk)
}

export function duckdb_vector_get_column_type(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_column_type(vector)
}

export function duckdb_vector_get_data(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_data(vector)
}

export function duckdb_vector_get_validity(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_validity(vector)
}

export function duckdb_validity_row_is_valid(validity: Deno.PointerObject, row_index: bigint) {
  return ffi.symbols.duckdb_validity_row_is_valid(validity, row_index)
}

export function duckdb_get_type_id(type: ArrayBuffer) {
  return ffi.symbols.duckdb_get_type_id(type)
}

export function duckdb_logical_type_get_alias(type: ArrayBuffer) {
  const pointer = ffi.symbols.duckdb_logical_type_get_alias(type)
  return pointer ? Deno.UnsafePointerView.getCString(pointer) : "Unknown"
}

export function duckdb_destroy_data_chunk(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_destroy_data_chunk(Deno.UnsafePointer.of(chunk))
}

export function duckdb_string_is_inlined(string_t: ArrayBuffer) {
  return ffi.symbols.duckdb_string_is_inlined(string_t)
}

export function duckdb_string_t_length(string_t: ArrayBuffer) {
  return ffi.symbols.duckdb_string_t_length(string_t)
}

export function duckdb_string_t_data(string_t: ArrayBuffer) {
  return ffi.symbols.duckdb_string_t_data(Deno.UnsafePointer.of(string_t))
}