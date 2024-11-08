// File: src/index.ts
import { getDuckDBLibraryPath } from "../fetch.ts";
import { symbols } from "../ffi/symbols/index.ts";

const ffi = Deno.dlopen(await getDuckDBLibraryPath(), symbols.asynchronous)

import { duckdb_error_type, duckdb_result_type, duckdb_state, duckdb_statement_type, duckdb_type } from "../ffi/enums.ts";
export { rows } from "../helpers.ts"

export async function open(path: string = ":memory:", options?: Record<string, string>): Promise<Deno.PointerObject> {
  const database = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const error = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const config = await create_config()
  options && await Promise.all(Object.entries(options).map(([name, value]) => {
    set_config(config, name, value)
  }))
  const state = await ffi.symbols.duckdb_open_ext(
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

export async function close(database: Deno.PointerObject) {
  await ffi.symbols.duckdb_close(database)
}

export async function create_config(): Promise<ArrayBuffer> {
  const config = new ArrayBuffer(8);
  const state = await ffi.symbols.duckdb_create_config(Deno.UnsafePointer.of(config));
  if (!config || state === duckdb_state.DuckDBError) throw Error(`Failed to create config`);
  return config
}

export async function config_count() {
  return await ffi.symbols.duckdb_config_count()
}

export async function get_config_flag(index: bigint) {
  let name = Deno.UnsafePointer.of(new Uint8Array(8))
  let description = Deno.UnsafePointer.of(new Uint8Array(8))
  const state = await ffi.symbols.duckdb_get_config_flag(index, name, description)
  if (!name || !description || state === duckdb_state.DuckDBError) throw Error(`Invalid index`)
  name = new Deno.UnsafePointerView(name).getPointer()
  description = new Deno.UnsafePointerView(description).getPointer()
  return [
    name && Deno.UnsafePointerView.getCString(name),
    description && Deno.UnsafePointerView.getCString(description)
  ]
}

export async function set_config(config: ArrayBuffer, name: string, value: string) {
  const state = await ffi.symbols.duckdb_set_config(config, new TextEncoder().encode(name + "\0"), new TextEncoder().encode(value + "\0"))
  if (state === duckdb_state.DuckDBError) throw Error(`Invalid config name or value`)
}

export async function destroy_config(config: Deno.PointerObject) {
  await ffi.symbols.duckdb_destroy_config(config)
}

export async function connect(database: Deno.PointerObject): Promise<Deno.PointerObject> {
  const connection = Deno.UnsafePointer.of(new ArrayBuffer(8))
  const state = await ffi.symbols.duckdb_connect(
    Deno.UnsafePointerView.getArrayBuffer(database, 8),
    connection
  )
  if (!connection || state === duckdb_state.DuckDBError) throw Error(`Failed to connect`)
  return connection
}

export async function disconnect(connection: Deno.PointerObject) {
  await ffi.symbols.duckdb_disconnect(connection)
}

export async function library_version(): Promise<string> {
  const version = await ffi.symbols.duckdb_library_version()
  return version ? new Deno.UnsafePointerView(version).getCString() : ""
}

export async function query(connection: Deno.PointerObject, query: string) {
  const result = Deno.UnsafePointer.of(new ArrayBuffer(48))
  const state = await ffi.symbols.duckdb_query(
    Deno.UnsafePointerView.getArrayBuffer(connection, 8),
    new TextEncoder().encode(query + "\0"),
    result
  )
  if (result) {
    if (state === duckdb_state.DuckDBError) {
      const errorType = await result_error_type(result)
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

export async function destroy_result(result: Deno.PointerObject) {
  await ffi.symbols.duckdb_destroy_result(result)
}

export async function column_name(result: Deno.PointerObject, index: bigint | number): Promise<string> {
  const name = await ffi.symbols.duckdb_column_name(result, BigInt(index))
  if (name === null) throw new Error("Column not found. Index value may be invalid.");
  return Deno.UnsafePointerView.getCString(name)
}

export async function column_type(result: Deno.PointerObject, index: bigint | number): Promise<string | void> {
  return duckdb_type[await ffi.symbols.duckdb_column_type(result, BigInt(index))]
}

export async function result_statement_type(result: Deno.PointerObject): Promise<string | void> {
  return duckdb_statement_type[await ffi.symbols.duckdb_result_statement_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))]
}

export async function column_logical_type(result: Deno.PointerObject, index: bigint | number): Promise<ArrayBuffer> {
  const type = await ffi.symbols.duckdb_column_logical_type(result, BigInt(index))
  if (type === null) throw new Error("Column not found. Index value may be invalid.");
  return type
}

export async function decimal_width(type: ArrayBuffer) {
  return await ffi.symbols.duckdb_decimal_width(type)
}

export async function decimal_scale(type: ArrayBuffer) {
  return await ffi.symbols.duckdb_decimal_scale(type)
}

export async function decimal_internal_type(type: ArrayBuffer) {
  return await ffi.symbols.duckdb_decimal_internal_type(type)
}

export async function column_count(result: Deno.PointerObject): Promise<bigint> {
  return await ffi.symbols.duckdb_column_count(result)
}

export async function rows_changed(result: Deno.PointerObject): Promise<bigint> {
  return await ffi.symbols.duckdb_rows_changed(result)
}

export async function result_error(result: Deno.PointerObject): Promise<string> {
  const error = await ffi.symbols.duckdb_result_error(result)
  return error ? Deno.UnsafePointerView.getCString(error) : "No errors"
}

export async function result_error_type(result: Deno.PointerObject): Promise<string | void> {
  const type = await ffi.symbols.duckdb_result_error_type(result)
  if (type) return duckdb_error_type[type];
}

export async function result_return_type(result: Deno.PointerObject): Promise<string | void> {
  const type = await ffi.symbols.duckdb_result_return_type(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  return duckdb_result_type[type]
}

export async function fetch_chunk(result: Deno.PointerObject) {
  const buffer = await ffi.symbols.duckdb_fetch_chunk(Deno.UnsafePointerView.getArrayBuffer(result, 48))
  if (buffer.every(b => b === 0)) return null
  return buffer
}

export async function data_chunk_get_column_count(chunk: ArrayBuffer) {
  return await ffi.symbols.duckdb_data_chunk_get_column_count(chunk)
}

export async function data_chunk_get_vector(chunk: ArrayBuffer, column_index: bigint | number) {
  return await ffi.symbols.duckdb_data_chunk_get_vector(chunk, BigInt(column_index))
}

export async function data_chunk_get_size(chunk: ArrayBuffer) {
  return await ffi.symbols.duckdb_data_chunk_get_size(chunk)
}

export async function vector_get_column_type(vector: ArrayBuffer) {
  return await ffi.symbols.duckdb_vector_get_column_type(vector)
}

export async function vector_get_data(vector: ArrayBuffer) {
  return await ffi.symbols.duckdb_vector_get_data(vector)
}

export async function vector_get_validity(vector: ArrayBuffer) {
  return await ffi.symbols.duckdb_vector_get_validity(vector)
}

export async function validity_row_is_valid(validity: Deno.PointerObject, row_index: bigint) {
  return await ffi.symbols.duckdb_validity_row_is_valid(validity, row_index)
}

export async function get_type_id(type: ArrayBuffer) {
  return await ffi.symbols.duckdb_get_type_id(type)
}

export async function destroy_data_chunk(chunk: ArrayBuffer) {
  return await ffi.symbols.duckdb_destroy_data_chunk(Deno.UnsafePointer.of(chunk))
}

export async function get_config_flags() {
  const flags = await Promise.all(
    Array.from({ length: Number(await ffi.symbols.duckdb_config_count()) }, async (_, i) => {
      return await get_config_flag(BigInt(i));
    })
  );
  return flags.reduce((acc, [name, description]) => {
    if (name) Object.assign(acc, { [name]: description });
    return acc;
  }, {});
}