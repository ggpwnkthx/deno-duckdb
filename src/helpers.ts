import { duckdb_type } from "./ffi/enums.ts";
import { config_count,  data_chunk_get_column_count,  data_chunk_get_size,  data_chunk_get_vector,  destroy_data_chunk,  fetch_chunk,  get_config_flag,  get_type_id,  validity_row_is_valid,  vector_get_column_type,  vector_get_data,  vector_get_validity } from "./index.ts";

// export const DuckDBConfigurationKeys = Array.from({ length: Number(config_count()) }, (_, i) => {
//   return get_config_flag(BigInt(i));
// }).reduce((acc, [name, description]) => {
//   if (name) Object.assign(acc, {[name]: description})
//   return acc;
// }, {});

export function decodeDuckDBValue({ pointer, type, rowIndex }: { pointer: Deno.PointerObject, type: duckdb_type, rowIndex: number }) {
  const view = new Deno.UnsafePointerView(pointer)
  switch (type) {
    case duckdb_type.DUCKDB_TYPE_INVALID:
      return undefined
    case duckdb_type.DUCKDB_TYPE_BOOLEAN:
      return view.getBool(rowIndex)
    case duckdb_type.DUCKDB_TYPE_TINYINT:
      return view.getInt8(rowIndex)
    case duckdb_type.DUCKDB_TYPE_SMALLINT:
      return view.getInt16(rowIndex * 2)
    case duckdb_type.DUCKDB_TYPE_INTEGER:
      return view.getInt32(rowIndex * 4)
    case duckdb_type.DUCKDB_TYPE_BIGINT:
      return view.getBigInt64(rowIndex * 8)
    case duckdb_type.DUCKDB_TYPE_UTINYINT:
      return view.getUint8(rowIndex)
    case duckdb_type.DUCKDB_TYPE_USMALLINT:
      return view.getUint16(rowIndex * 2)
    case duckdb_type.DUCKDB_TYPE_UINTEGER:
      return view.getUint32(rowIndex * 4)
    case duckdb_type.DUCKDB_TYPE_UBIGINT:
      return view.getBigUint64(rowIndex * 8)
    case duckdb_type.DUCKDB_TYPE_FLOAT:
      return view.getFloat32(rowIndex * 4)
    case duckdb_type.DUCKDB_TYPE_DOUBLE:
      return view.getFloat64(rowIndex * 8)

    case duckdb_type.DUCKDB_TYPE_VARCHAR: {
      const length = view.getInt32(rowIndex * 16)
      if (length <= 12) {
        return new TextDecoder().decode(
          Deno.UnsafePointerView.getArrayBuffer(view.pointer, length, rowIndex * 16 + 4)
        )
      } else {
        const ptr = view.getPointer(rowIndex * 16 + 8);
        return ptr ? new TextDecoder().decode(Deno.UnsafePointerView.getArrayBuffer(ptr, length)) : null
      }
    }
    default: return undefined
  }
}

export function* rows(query: Deno.PointerObject) {
  while (true) {
    const chunk = fetch_chunk(query);
    if (!chunk) break;

    const column_count = data_chunk_get_column_count(chunk);
    const row_count = data_chunk_get_size(chunk);

    const columns = Array.from({ length: Number(column_count) }, (_, i) => {
      const vector = data_chunk_get_vector(chunk, i);
      return {
        type: vector_get_column_type(vector),
        data: vector_get_data(vector) as Deno.PointerObject,
        validity: vector_get_validity(vector) as Deno.PointerObject,
      };
    });

    for (let rowIndex = 0; rowIndex < row_count; rowIndex++) {
      const row = Array.from({ length: Number(column_count) }, (_, column_index) => {
        if (validity_row_is_valid(columns[column_index].validity, BigInt(rowIndex))) {
          return decodeDuckDBValue({
            pointer: columns[column_index].data,
            type: get_type_id(columns[column_index].type),
            rowIndex
          });
        }
        return null;
      });
      yield row;
    }

    destroy_data_chunk(chunk);
  }
}