import { getDuckDBLibraryPath, defaultPath as DuckDBLibPath } from "./fetch.ts";
await getDuckDBLibraryPath();

// Import TypeScript interfaces from the types file
import {
  Database,
  Connection,
  Config,
} from "./types.ts"; // Adjust the path as necessary
/**
 * DuckDB FFI Wrapper Class
 */
export class DuckDB {
  private static dylib = Deno.dlopen(DuckDBLibPath, {
    duckdb_open: { parameters: ["pointer", "pointer"], result: "i32" },
    duckdb_close: { parameters: ["pointer"], result: "void" },
    duckdb_connect: { parameters: ["pointer", "pointer"], result: "i32" },
    // ... define other symbols
  });
  
  constructor() {}

  public async open(path?: string, config?: Config): Promise<Database> {
    // Implementation using the OpenFunction type
  }

  public async close(database: Database): Promise<void> {
    // Implementation using the CloseFunction type
  }

  public async connect(database: Database): Promise<Connection> {
    // Implementation using the ConnectFunction type
  }

}