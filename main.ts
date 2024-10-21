// main.ts

import { DuckDB } from "./src/index.ts";

const duckDB = new DuckDB();
duckDB.open();
console.log("Database opened.");
duckDB.connect();
console.log("Connected to the database.");
console.log("Library Version:", duckDB.getLibraryVersion());
