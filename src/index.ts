import lib from "./ffi/index.ts";
import { duckdb_state } from "./ffi/types.ts";

// Define a type for the allocatePointerArray return value
type BigUInt = {
  buffer: BigUint64Array;
  pointer: Deno.PointerValue;
  get(index?: number): bigint;
  set(value: bigint, index?: number): void;
};
type Database = BigUInt
type Connection = BigUInt

export class DuckDB {
  private static allocateBigUInt(): BigUInt {
    const buffer = new BigUint64Array(1);
    const pointer = Deno.UnsafePointer.of(buffer);
    return {
      buffer,
      pointer,
      get(index = 0) {
        return buffer[index];
      },
      set(value: bigint, index = 0) {
        buffer[index] = value;
      },
    };
  }
  private static cstr(str: string): Deno.PointerValue {
    const encoder = new TextEncoder();
    const strBuf = encoder.encode(str + "\0");
    return Deno.UnsafePointer.of(strBuf);
  }

  static open(path: string) {
    const db = DuckDB.allocateBigUInt()
    const error = DuckDB.allocateBigUInt()
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
    const conn = DuckDB.allocateBigUInt()
    const state = lib.symbols.duckdb_connect(
      database.get(), 
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

  getLibraryVersion(): string {
    const versionPtr = lib.symbols.duckdb_library_version();
    if (versionPtr) return Deno.UnsafePointerView.getCString(versionPtr);
    return "Unknown"
  }
}