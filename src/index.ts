// File: src/index.ts
import lib from "./ffi/index.ts";
import { duckdb_state } from "./ffi/types.ts";

class CPointer {
  private _buffer: BigUint64Array;
  constructor () { this._buffer = new BigUint64Array(1); }
  public get buffer() { return this._buffer; }
  public get pointer() { return Deno.UnsafePointer.of(this._buffer); }
  public get address() { return this._buffer[0] }
}
type Database = CPointer
type Connection = CPointer

export class DuckDB {
  private static cstr(str: string): Deno.PointerValue {
    const encoder = new TextEncoder();
    const strBuf = encoder.encode(str + "\0");
    return Deno.UnsafePointer.of(strBuf);
  }

  static open(path: string) {
    const db = new CPointer()
    const error = new CPointer()
    const state = lib.symbols.duckdb_open_ext(
      DuckDB.cstr(path), 
      db.pointer,
      null,
      error.pointer
    );
    if (state !== duckdb_state.DuckDBSuccess) {
      if (error.pointer) {
        const errorMessage = new Deno.UnsafePointerView(error.pointer).getCString();
        lib.symbols.duckdb_free(error.pointer);
        throw Error(errorMessage);
      }
    }
    return db
  }

  static connect(database: Database): Connection {
    const conn = new CPointer()
    const state = lib.symbols.duckdb_connect(
      database.address, 
      conn.pointer
    );
    if (state !== duckdb_state.DuckDBSuccess) {
      throw Error("Failed to connect to DuckDB");
    }
    return conn
  }

  static disconnect(connection: Connection): void {
    lib.symbols.duckdb_disconnect(connection.pointer)
  }

  static close(database: Database): void {
    lib.symbols.duckdb_close(database.pointer);
  }

  static get version(): string {
    const pointer = lib.symbols.duckdb_library_version();
    if (pointer) return Deno.UnsafePointerView.getCString(pointer);
    return "Unknown"
  }
}