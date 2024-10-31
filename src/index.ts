// File: src/index.ts
import ffi from "./ffi/index.ts";
import { duckdb_error_type, duckdb_result_type, duckdb_state, duckdb_statement_type, duckdb_type } from "./ffi/enums.ts";
import { rows } from "./helpers.ts"

export { rows }

export function open(path: string = ":memory:", options?: Record<string, string>): Deno.PointerObject {
  const database = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const error = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const config = create_config()
  options && Object.entries(options).forEach(([name, value]) => {
    set_config(config, name, value)
  })
  const state = ffi.symbols.duckdb_open_ext(
    new TextEncoder().encode(path + "\0"),
    database,
    config,
    error
  )
  if (!database || state === duckdb_state.DuckDBError) {
    if (error) {
      const pointer = new Deno.UnsafePointerView(error).getPointer()
      if (pointer) {
        throw Error(`Failed to open: ${path}`, { cause: Deno.UnsafePointerView.getCString(pointer) })
      }
    }
    throw Error(`Failed to open: ${path}`)
  }
  return database
}

export function close(database: Deno.PointerObject) {
  ffi.symbols.duckdb_close(database)
}

export function create_config(): ArrayBuffer {
  const config = new ArrayBuffer(8);
  const state = ffi.symbols.duckdb_create_config(Deno.UnsafePointer.of(config));
  if (!config || state === duckdb_state.DuckDBError) throw Error(`Failed to create config`);
  return config
}

export function config_count() {
  return ffi.symbols.duckdb_config_count()
}

export function get_config_flag(index: bigint) {
  let name = Deno.UnsafePointer.of(new Uint8Array(8))
  let description = Deno.UnsafePointer.of(new Uint8Array(8))
  const state = ffi.symbols.duckdb_get_config_flag(index, name, description)
  if (!name || !description || state === duckdb_state.DuckDBError) throw Error(`Invalid index`)
  name = new Deno.UnsafePointerView(name).getPointer()
  description = new Deno.UnsafePointerView(description).getPointer()
  return [
    name && Deno.UnsafePointerView.getCString(name), 
    description && Deno.UnsafePointerView.getCString(description)
  ]
}

export function set_config(config: ArrayBuffer, name: string, value: string) {
  const state = ffi.symbols.duckdb_set_config(config, new TextEncoder().encode(name + "\0"), new TextEncoder().encode(value + "\0"))
  if (state === duckdb_state.DuckDBError) throw Error(`Invalid config name or value`)
}

export function destroy_config(config: Deno.PointerObject) {
  ffi.symbols.duckdb_destroy_config(config)
}

export function connect(database: Deno.PointerObject): Deno.PointerObject {
  const connection = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const state = ffi.symbols.duckdb_connect(
    Deno.UnsafePointerView.getArrayBuffer(database, 8),
    connection
  )
  if (!connection || state === duckdb_state.DuckDBError) throw Error(`Failed to connect`)
  return connection
}

export function disconnect(connection: Deno.PointerObject) {
  ffi.symbols.duckdb_disconnect(connection)
}

export function library_version(): string {
  const version = ffi.symbols.duckdb_library_version()
  return version ? new Deno.UnsafePointerView(version).getCString() : ""
}

export function query(connection: Deno.PointerObject, query: string) {
  const result = Deno.UnsafePointer.of(new ArrayBuffer(48))
  const state = ffi.symbols.duckdb_query(
    Deno.UnsafePointerView.getArrayBuffer(connection, 8),
    new TextEncoder().encode(query + "\0"),
    result
  )
  if (result) {
    if (state === duckdb_state.DuckDBError) {
      const errorType = result_error_type(result)
      const error = {
        message: errorType ?? `DuckDB error type [${errorType}] is undocumented`,
        options: { cause: result_error(result) },
      }
      destroy_result(result);
      throw Error(error.message, error.options)
    }
  }
  if (!result) throw Error(`Failed to query`)
  return result
}

export function destroy_result(result: Deno.PointerObject) {
  ffi.symbols.duckdb_destroy_result(result)
}

export function column_name(result: Deno.PointerObject, index: bigint | number): string {
  const name = ffi.symbols.duckdb_column_name(result, BigInt(index))
  if (name === null) throw new Error("Column not found. Index value may be invalid.");
  return Deno.UnsafePointerView.getCString(name)
}

export function column_type(result: Deno.PointerObject, index: bigint | number): string | void {
  return duckdb_type[ffi.symbols.duckdb_column_type(result, BigInt(index))]
}

export function result_statement_type(result: Deno.PointerObject): string | void {
  return duckdb_statement_type[ffi.symbols.duckdb_result_statement_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))]
}

export function column_logical_type(result: Deno.PointerObject, index: bigint | number): ArrayBuffer {
  const type = ffi.symbols.duckdb_column_logical_type(result, BigInt(index))
  if (type === null) throw new Error("Column not found. Index value may be invalid.");
  return type
}

export function column_count(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_column_count(result)
}

export function rows_changed(result: Deno.PointerObject): bigint {
  return ffi.symbols.duckdb_rows_changed(result)
}

export function result_error(result: Deno.PointerObject): string {
  const error = ffi.symbols.duckdb_result_error(result)
  return error ? Deno.UnsafePointerView.getCString(error) : "No errors"
}

export function result_error_type(result: Deno.PointerObject): string | void {
  const type = ffi.symbols.duckdb_result_error_type(result)
  if (type) return duckdb_error_type[type];
}

export function result_return_type(result: Deno.PointerObject): string | void {
  const type = ffi.symbols.duckdb_result_return_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  return duckdb_result_type[type]
}

export function fetch_chunk(result: Deno.PointerObject) {
  const buffer = ffi.symbols.duckdb_fetch_chunk(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  if (buffer.every(b => b === 0)) return null
  return buffer
}

export function data_chunk_get_column_count(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_data_chunk_get_column_count(chunk)
}

export function data_chunk_get_vector(chunk: ArrayBuffer, column_index: bigint | number) {
  return ffi.symbols.duckdb_data_chunk_get_vector(chunk, BigInt(column_index))
}

export function data_chunk_get_size(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_data_chunk_get_size(chunk)
}

export function vector_get_column_type(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_column_type(vector)
}

export function vector_get_data(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_data(vector)
}

export function vector_get_validity(vector: ArrayBuffer) {
  return ffi.symbols.duckdb_vector_get_validity(vector)
}

export function validity_row_is_valid(validity: Deno.PointerObject, row_index: bigint) {
  return ffi.symbols.duckdb_validity_row_is_valid(validity, row_index)
}

export function get_type_id(type: ArrayBuffer) {
  return ffi.symbols.duckdb_get_type_id(type)
}

export function destroy_data_chunk(chunk: ArrayBuffer) {
  return ffi.symbols.duckdb_destroy_data_chunk(Deno.UnsafePointer.of(chunk))
}
