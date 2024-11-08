// File: src/objective/index.ts
import { duckdb_state } from "../ffi/enums.ts";
import { async } from "../ffi/index.ts";
import { Config } from "./Config.ts";

export class Database {
  private pointer: Deno.PointerObject | undefined = undefined
  public async open(path: string = ":memory:", options?: Record<string, string>): Promise<void> {
    const database = Deno.UnsafePointer.of(new ArrayBuffer(8))
    const error = Deno.UnsafePointer.of(new ArrayBuffer(8))
    const config = await Config.create()
    options && await Promise.all(Object.entries(options).map(([name, value]) => {
      return config.set_flag(name, value)
    }))
    const state = await async.duckdb_open_ext(
      new TextEncoder().encode(path + "\0"),
      database,
      config.buffer,
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
    this.pointer = database
  }
  public async close(): Promise<void> {
    this.pointer && await async.duckdb_close(this.pointer)
  }
}