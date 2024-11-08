// File: src/objective/Config.ts
import { duckdb_state } from "../ffi/enums.ts";
import { async } from "../ffi/index.ts"
import { config_count } from "../sync.ts";

export class Config {
  private _buffer = new ArrayBuffer(8);
  public get buffer() { return this._buffer}
  
  public static async create(): Promise<Config> {
    const config = new Config()
    config._buffer = new ArrayBuffer(8);
    const state = await async.duckdb_create_config(Deno.UnsafePointer.of(config.buffer));
    if (!config._buffer || state === duckdb_state.DuckDBError) throw Error(`Failed to create config`);
    return config
  }
  
  public static async count() {
    return await async.duckdb_config_count()
  }
  
  public static async get_flag(index: bigint) {
    let name = Deno.UnsafePointer.of(new Uint8Array(8))
    let description = Deno.UnsafePointer.of(new Uint8Array(8))
    const state = await async.duckdb_get_config_flag(index, name, description)
    if (!name || !description || state === duckdb_state.DuckDBError) throw Error(`Invalid index`)
    name = new Deno.UnsafePointerView(name).getPointer()
    description = new Deno.UnsafePointerView(description).getPointer()
    return [
      name && Deno.UnsafePointerView.getCString(name),
      description && Deno.UnsafePointerView.getCString(description)
    ]
  }
  
  public async set_flag(name: string, value: string) {
    const state = await async.duckdb_set_config(this.buffer, new TextEncoder().encode(name + "\0"), new TextEncoder().encode(value + "\0"))
    if (state === duckdb_state.DuckDBError) throw Error(`Invalid config name or value`)
  }
  public async destroy(config: Deno.PointerObject) {
    await async.duckdb_destroy_config(config)
  }
}