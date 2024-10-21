// main.ts

import { DuckDB } from "./src/index.ts";

const duckDB = new DuckDB();
await duckDB.open();
console.log("Database opened.");
await duckDB.connect();
console.log("Connected to the database.");
console.log("Library Version:", duckDB.getLibraryVersion());
