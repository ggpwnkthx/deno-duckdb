// File: src/index.ts
import ffi from "./ffi/index.ts";
import { duckdb_result_type, duckdb_state, duckdb_statement_type } from "./ffi/types.ts";

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
  const state = ffi.symbols.duckdb_query(
    new Deno.UnsafePointerView(connection).getBigUint64(),
    Deno.UnsafePointer.of(new TextEncoder().encode(query + "\0")),
    result
  )
  console.debug(duckdb_state[state])
  if (state === duckdb_state.DuckDBError) {
    const error = ffi.symbols.duckdb_result_error(result);
    if (error) {
      const errorMessage = new Deno.UnsafePointerView(error).getCString();
      console.error(`Query Error: ${errorMessage}`);
    }
    ffi.symbols.duckdb_destroy_result(result);

    return undefined;
  }
  if (result) return result
}

export function duckdb_result_statement_type(result: Deno.PointerObject): duckdb_statement_type {
  return ffi.symbols.duckdb_result_statement_type(new Deno.UnsafePointerView(result).getBigUint64())
}

export function duckdb_result_return_type(result: Deno.PointerObject): duckdb_result_type {
  return ffi.symbols.duckdb_result_return_type(new Deno.UnsafePointerView(result).getBigUint64())
}

export function duckdb_fetch_chunk(result: Deno.PointerObject) {
  return ffi.symbols.duckdb_fetch_chunk(new Deno.UnsafePointerView(result).getBigUint64())
}

export function duckdb_destroy_result(result: Deno.PointerObject) {
  ffi.symbols.duckdb_destroy_result(result)
}