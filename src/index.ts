import lib from "./ffi/index.ts";
import { duckdb_state } from "./ffi/types.ts";

function cstr(str: string): Deno.PointerValue {
  const encoder = new TextEncoder();
  const strBuf = encoder.encode(str + "\0");
  return Deno.UnsafePointer.of(strBuf);
}

export class DuckDB {
  private dbBuffer = new BigUint64Array(1);
  private dbPointer: Deno.PointerValue = null;
  private connBuffer = new BigUint64Array(1);
  private connPointer: Deno.PointerValue = null;

  constructor(private path: string = ":memory:") {}

  open(): void {
    const result = lib.symbols.duckdb_open(cstr(this.path), this.dbBuffer);
    if (result !== duckdb_state.DuckDBSuccess) {
      throw new Error("Failed to open DuckDB database");
    }

    this.dbPointer = Deno.UnsafePointer.create(this.dbBuffer[0]);
    if (!this.dbPointer) {
      throw new Error("Invalid database handle");
    }
    console.debug(`Database '${this.path}' opened.`);
  }

  connect(): void {
    if (!this.dbPointer) {
      throw new Error("Database must be opened before connecting");
    }

    const result = lib.symbols.duckdb_connect(this.dbPointer, this.connBuffer);
    if (result !== duckdb_state.DuckDBSuccess) {
      throw new Error("Failed to connect to DuckDB");
    }

    this.connPointer = Deno.UnsafePointer.create(this.connBuffer[0]);
    if (!this.connPointer) {
      throw new Error("Invalid connection handle");
    }
    console.debug(`Database '${this.path}' connected.`);
  }

  close(): void {
    if (this.connPointer) {
      lib.symbols.duckdb_disconnect(this.connBuffer);
      this.connPointer = null;
      console.debug(`Database '${this.path}' disconnected.`);
    }

    if (this.dbPointer) {
      lib.symbols.duckdb_close(this.dbBuffer);
      this.dbPointer = null;
      console.debug(`Database '${this.path}' closed.`);
    }
  }

  getLibraryVersion(): string {
    const versionPtr = lib.symbols.duckdb_library_version() as Deno.PointerObject;
    return Deno.UnsafePointerView.getCString(versionPtr);
  }
}