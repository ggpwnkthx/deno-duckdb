import { assertEquals, assertThrows } from "@std/assert";
import { normalizeDatabaseConfig } from "../src/core/config.ts";
import {
  createDatabaseHandle,
  getPointerValue,
  isValidHandle,
  validateConnectionHandle,
  validateDatabaseHandle,
  validatePreparedStatementHandle,
  validateResultHandle,
} from "../src/core/handles.ts";
import { QueryError, ValidationError } from "../src/errors.ts";

Deno.test("core: normalizeDatabaseConfig trims path and normalizes options", () => {
  const normalized = normalizeDatabaseConfig({
    path: "  app.db  ",
    accessMode: "read_only",
    threads: "4",
    empty: "   ",
  });

  assertEquals(normalized.path, "app.db");
  assertEquals(normalized.options, [
    { name: "access_mode", value: "READ_ONLY" },
    { name: "threads", value: "4" },
  ]);
});

Deno.test("core: normalizeDatabaseConfig falls back to in-memory defaults", () => {
  const normalized = normalizeDatabaseConfig();

  assertEquals(normalized.path, ":memory:");
  assertEquals(normalized.options, []);
});

Deno.test("core: newly created opaque handles start as null pointers", () => {
  const handle = createDatabaseHandle();

  assertEquals(getPointerValue(handle), 0n);
  assertEquals(isValidHandle(handle), false);
});

Deno.test("core: getPointerValue respects byte offsets", () => {
  const backing = new Uint8Array(24);
  const expected = 0x1234567890ABCDEFn;

  new DataView(backing.buffer, 8, 8).setBigUint64(0, expected, true);

  const sliced = backing.subarray(8, 16);
  assertEquals(getPointerValue(sliced), expected);
});

Deno.test("core: validation rejects wrong handle shapes with typed errors", () => {
  assertThrows(
    () => validateDatabaseHandle(new Uint8Array(7)),
    ValidationError,
    "DatabaseHandle must be 8 bytes",
  );
  assertThrows(
    () => validateConnectionHandle(null),
    ValidationError,
    "ConnectionHandle must be a Uint8Array",
  );
  assertThrows(
    () => validatePreparedStatementHandle(new Uint8Array(9)),
    ValidationError,
    "PreparedStatementHandle must be 8 bytes",
  );
  assertThrows(
    () => validateResultHandle(new Uint8Array(8)),
    ValidationError,
    "ResultHandle must be 48 bytes",
  );
});

Deno.test("core: QueryError keeps the original SQL text", () => {
  const error = new QueryError("Bad SQL", "select * from nope");

  assertEquals(error.query, "select * from nope");
  assertEquals(error.code, "QUERY_ERROR");
  assertEquals(error.context?.query, "select * from nope");
});
