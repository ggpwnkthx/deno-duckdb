// main.ts

import { DuckDB } from "./src/static.ts";

// import { join } from "https://deno.land/std@0.224.0/path/join.ts";
// import { defaultDir, getDuckDBLibraryPath } from "./src/fetch.ts";
// import { extractEnumDeclarations } from "./src/ast/enums.ts";
// import { extractRecordDeclarations } from "./src/ast/records.ts";
// import { writeTypeScriptFile } from "./src/ast/writer.ts"
// import { extractTypedefDeclarations } from "./src/ast/typedefs.ts";
// import { getAST } from "./src/ast/index.ts";

// const libPath = await getDuckDBLibraryPath();

// const ast = await getAST(join(defaultDir, "duckdb.h"))
// // const enums = await extractEnumDeclarations(ast)
// // const records = await extractRecordDeclarations(ast)
// // const typedefs = await extractTypedefDeclarations(ast)
// Deno.writeTextFile(join(defaultDir, "ast.json"), JSON.stringify(ast))
// writeTypeScriptFile(ast, join(defaultDir, "bindings.ts"))

const db = new DuckDB(); // In-memory database

const createTableSQL = `
  CREATE TABLE users (
    id INTEGER,
    name VARCHAR
  );
`;

const insertSQL = `
  INSERT INTO users (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie');
`;

const selectSQL = `
  SELECT * FROM users;
`;

await db.query(createTableSQL);
await db.query(insertSQL);
const results = await db.query(selectSQL);

console.log("Query Results:", results);

db.close();