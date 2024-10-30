import { duckdb_type } from "./src/ffi/types.ts";
import { duckdb_close, duckdb_column_count, duckdb_column_name, duckdb_column_type, duckdb_connect, duckdb_data_chunk_get_column_count, duckdb_data_chunk_get_size, duckdb_data_chunk_get_vector, duckdb_destroy_data_chunk, duckdb_destroy_result, duckdb_disconnect, duckdb_fetch_chunk, duckdb_get_type_id, duckdb_library_version, duckdb_logical_type_get_alias, duckdb_open, duckdb_query, duckdb_result_return_type, duckdb_result_statement_type, duckdb_validity_row_is_valid, duckdb_vector_get_column_type, duckdb_vector_get_data, duckdb_vector_get_validity } from "./src/index.ts";

console.debug(duckdb_library_version())
const db = duckdb_open("duck.db")
if (db) {
  const conn = duckdb_connect(db)
  if (conn) {
    const query = duckdb_query(conn, `
      SELECT
        hash(i * 10 + j) AS id,
        IF (j % 2, true, false) AS bool,
        'test' as quest
      FROM generate_series(1, 10000) s(i)
      CROSS JOIN generate_series(1, 10) t(j)
      ORDER BY id
    `)
    // const query = duckdb_query(conn, `SELECT 42 AS answer, 'test' AS why`)
    if (query) {
      const result = {
        statement_type: duckdb_result_statement_type(query),
        result_type: duckdb_result_return_type(query),
        columns: Array.from({ length: Number(duckdb_column_count(query)) }, (_, i) => ({
          name: duckdb_column_name(query, i),
          type: duckdb_column_type(query, i)
        })),
        rows: 0n,
        data: [] as any[]
      }
      while (true) {
        const chunk = duckdb_fetch_chunk(query)
        if (!chunk) break;
        const column_count = duckdb_data_chunk_get_column_count(chunk)
        const row_count = duckdb_data_chunk_get_size(chunk)
        result.rows += row_count
        const columns = Array.from({ length: Number(column_count) }, (_, i) => {
          const vector = duckdb_data_chunk_get_vector(chunk, i)
          return {
            type: duckdb_vector_get_column_type(vector),
            data: duckdb_vector_get_data(vector) as Deno.PointerObject,
            validity: duckdb_vector_get_validity(vector) as Deno.PointerObject,
          }
        })
        const rows = Array.from({ length: Number(row_count) }, (_, row_index) => {
          return Array.from({ length: Number(column_count) }, (_, column_index) => {
            if (duckdb_validity_row_is_valid(columns[column_index].validity, BigInt(row_index))) {
              const view = new Deno.UnsafePointerView(columns[column_index].data)
              switch(duckdb_type[duckdb_get_type_id(columns[column_index].type)]) {
                case "DUCKDB_TYPE_INVALID": return undefined
                case "DUCKDB_TYPE_BOOLEAN": return view.getBool(row_index)
                case "DUCKDB_TYPE_TINYINT": return view.getInt8(row_index)
                case "DUCKDB_TYPE_SMALLINT": return view.getInt16(row_index * 2)
                case "DUCKDB_TYPE_INTEGER": return view.getInt32(row_index * 4)
                case "DUCKDB_TYPE_BIGINT": return view.getBigInt64(row_index * 8)
                case "DUCKDB_TYPE_UTINYINT": return view.getUint8(row_index)
                case "DUCKDB_TYPE_USMALLINT": return view.getUint16(row_index * 2)
                case "DUCKDB_TYPE_UINTEGER": return view.getUint32(row_index * 4)
                case "DUCKDB_TYPE_UBIGINT": return view.getBigUint64(row_index * 8)
                case "DUCKDB_TYPE_FLOAT": return view.getFloat32(row_index * 4)
                case "DUCKDB_TYPE_DOUBLE": return view.getFloat64(row_index * 8)

                case "DUCKDB_TYPE_VARCHAR": {
                  const stringPtr = view.getBigUint64(row_index * 8); // Assuming each pointer is 8 bytes on a 64-bit system
                  return row_index * 8
                  return null; // Null pointer means no string (optional safeguard)
                }
                default: return undefined
              }
            }
            return null
          })
        })
        result.data = result.data.concat(rows)
        duckdb_destroy_data_chunk(chunk)
      }
      duckdb_destroy_result(query)
      console.debug({ result })
    }
    duckdb_disconnect(conn)
  }
  duckdb_close(db)
}