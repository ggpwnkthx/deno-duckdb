// main.ts

import { DuckDB } from "./src/index.ts";

const duckDB = new DuckDB();
console.log("Library Version:", duckDB.getLibraryVersion());
duckDB.open();
duckDB.connect();
duckDB.close();
