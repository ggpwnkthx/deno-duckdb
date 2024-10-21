import lib from "./src/ffi/index.ts";

const { symbols: {
  duckdb_open,
  duckdb_close,
  duckdb_connect,
  duckdb_disconnect,
  duckdb_library_version,
} } = lib

const DuckDBSuccess = 0;
const DuckDBError = 1;

// Function to create a null-terminated C string and get a pointer to it
function cstr(str: string) {
  const encoder = new TextEncoder();
  const strBuf = encoder.encode(str + "\0");
  return Deno.UnsafePointer.of(strBuf);
}

// Allocate buffers for output pointers
const dbOutPtr = new BigUint64Array(1); // For duckdb_database*
const connOutPtr = new BigUint64Array(1); // For duckdb_connection*

// Open the database
const pathPtr = cstr(":memory:");
const openResult = duckdb_open(pathPtr, dbOutPtr);
if (openResult !== DuckDBSuccess) {
  throw new Error("Failed to open DuckDB database");
}

// Retrieve the database handle as a Deno.UnsafePointer
const dbHandleValue = dbOutPtr[0];
const dbHandle = Deno.UnsafePointer.create(dbHandleValue);
if (dbHandle === null) {
  throw new Error("Failed to obtain database handle");
}

// Connect to the database
const connectResult = duckdb_connect(dbHandle, connOutPtr);
if (connectResult !== DuckDBSuccess) {
  throw new Error("Failed to connect to DuckDB database");
}

// Retrieve the connection handle as a Deno.UnsafePointer
const connHandleValue = connOutPtr[0];
const connHandle = Deno.UnsafePointer.create(connHandleValue);
if (connHandle === null) {
  throw new Error("Failed to obtain connection handle");
}

// Get the DuckDB library version
const versionPtr = duckdb_library_version() as Deno.PointerObject;
const version = Deno.UnsafePointerView.getCString(versionPtr);
console.log("DuckDB Library Version:", version);

// Clean up
duckdb_disconnect(connOutPtr);
duckdb_close(dbOutPtr);