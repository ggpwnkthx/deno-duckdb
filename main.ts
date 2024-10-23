import { DuckDB } from "./src/index.ts";

console.debug(DuckDB.version)
const db = DuckDB.open(":memory:")
console.debug({db})
const conn = DuckDB.connect(db)
console.debug({conn})
DuckDB.disconnect(conn)
console.debug({conn})
DuckDB.close(db)
console.debug({db})