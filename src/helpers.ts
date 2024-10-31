import { duckdb_type } from "./ffi/types.ts";

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