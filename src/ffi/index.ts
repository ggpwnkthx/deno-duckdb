// File: src/ffi/index.ts
import { getDuckDBLibraryPath } from "../fetch.ts";
import { symbols } from "../ffi/symbols/index.ts";

const path = await getDuckDBLibraryPath()
export const sync = Deno.dlopen(path, symbols.synchronous).symbols
export const async = Deno.dlopen(path, symbols.asynchronous).symbols