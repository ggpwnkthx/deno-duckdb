import lib from "./ffi/index.ts";
import { duckdb_state } from "./ffi/types.ts";

function cstr(str: string): Deno.PointerValue {
  const encoder = new TextEncoder();
  const strBuf = encoder.encode(str + "\0");
  return Deno.UnsafePointer.of(strBuf);
}

export class DuckDB {
  private dbHandle: Deno.UnsafePointer | null = null;
  private connHandle: Deno.UnsafePointer | null = null;

  constructor(private path: string = ":memory:") {}

  open(): void {
    const dbOutPtr = new BigUint64Array(1);
    const pathPtr = cstr(this.path);

    const result = lib.symbols.duckdb_open(pathPtr, dbOutPtr);
    if (result !== duckdb_state.DuckDBSuccess) {
      throw new Error("Failed to open DuckDB database");
    }

    this.dbHandle = Deno.UnsafePointer.create(dbOutPtr[0]);
    if (!this.dbHandle) {
      throw new Error("Invalid database handle");
    }
  }

  connect(): void {
    if (!this.dbHandle) {
      throw new Error("Database must be opened before connecting");
    }

    const connOutPtr = new BigUint64Array(1);
    const result = lib.symbols.duckdb_connect(this.dbHandle, connOutPtr);
    if (result !== duckdb_state.DuckDBSuccess) {
      throw new Error("Failed to connect to DuckDB");
    }

    this.connHandle = Deno.UnsafePointer.create(connOutPtr[0]);
    if (!this.connHandle) {
      throw new Error("Invalid connection handle");
    }
  }

  close(): void {
    if (this.connHandle) {
      lib.symbols.duckdb_disconnect(this.connHandle);
      this.connHandle = null;
    }

    if (this.dbHandle) {
      lib.symbols.duckdb_close(this.dbHandle);
      this.dbHandle = null;
    }
  }

  getLibraryVersion(): string {
    const versionPtr = lib.symbols.duckdb_library_version() as Deno.PointerObject;
    return Deno.UnsafePointerView.getCString(versionPtr);
  }
}