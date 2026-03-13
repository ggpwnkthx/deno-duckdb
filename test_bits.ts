import { Database } from "./src/objective/mod.ts";

const db = new Database();
const conn = await db.connect();
const result = conn.query(
  "SELECT 12.34::DECIMAL(10,2) AS amount, unhex('C0FFEE') AS payload, '10101'::BIT AS bits",
);
console.log("Columns:", result.getColumnInfos());
console.log("Rows:", result.fetchAll());
await conn.close();
await db.close();
