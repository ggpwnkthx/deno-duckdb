import { assertEquals, assertThrows } from "@std/assert";
import { normalizeDatabaseConfig } from "../src/core/config/mod.ts";
import {
  getConfigEnumValues,
  getConfigOptionType,
  isValidConfigKey,
  validateConfigValue,
  validateDatabaseConfig,
} from "../src/core/config/validate.ts";
import {
  createDatabaseHandle,
  getPointerValue,
  isValidHandle,
  validateConnectionHandle,
  validateDatabaseHandle,
  validatePreparedStatementHandle,
  validateResultHandle,
} from "../src/core/handles.ts";
import { QueryError, ValidationError } from "@ggpwnkthx/duckdb";

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

Deno.test("core: normalizeDatabaseConfig normalizes access_mode key", () => {
  const normalized = normalizeDatabaseConfig({
    path: "app.db",
    access_mode: "read_only",
  });

  assertEquals(normalized.path, "app.db");
  assertEquals(normalized.options, [
    { name: "access_mode", value: "READ_ONLY" },
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

// === Config Schema Tests ===

Deno.test("core: isValidConfigKey returns true for known keys", () => {
  assertEquals(isValidConfigKey("access_mode"), true);
  assertEquals(isValidConfigKey("threads"), true);
  assertEquals(isValidConfigKey("max_memory"), true);
  assertEquals(isValidConfigKey("unknown_option"), false);
});

Deno.test("core: getConfigOptionType returns correct types", () => {
  assertEquals(getConfigOptionType("access_mode"), "enum");
  assertEquals(getConfigOptionType("threads"), "integer");
  assertEquals(getConfigOptionType("enable_external_access"), "boolean");
  assertEquals(getConfigOptionType("max_memory"), "bigint");
  assertEquals(getConfigOptionType("temp_directory"), "string");
});

Deno.test("core: getConfigEnumValues returns allowed values for enum options", () => {
  const accessModeValues = getConfigEnumValues("access_mode");
  assertEquals(accessModeValues, ["AUTOMATIC", "READ_ONLY", "READ_WRITE"]);
});

Deno.test("core: validateConfigValue validates enum values", () => {
  assertEquals(validateConfigValue("access_mode", "READ_ONLY"), null);
  assertEquals(validateConfigValue("access_mode", "read_only"), null);
  assertEquals(
    validateConfigValue("access_mode", "invalid"),
    "Invalid value 'invalid' for 'access_mode'. Allowed: AUTOMATIC, READ_ONLY, READ_WRITE",
  );
});

Deno.test("core: validateConfigValue validates integer bounds", () => {
  assertEquals(validateConfigValue("threads", "4"), null);
  assertEquals(
    validateConfigValue("threads", "-1"),
    "Value -1 for 'threads' is below minimum 0",
  );
  assertEquals(
    validateConfigValue("threads", "1000"),
    "Value 1000 for 'threads' exceeds maximum 256",
  );
});

Deno.test("core: validateConfigValue validates boolean values", () => {
  assertEquals(validateConfigValue("enable_external_access", "true"), null);
  assertEquals(validateConfigValue("enable_external_access", "false"), null);
  assertEquals(
    validateConfigValue("enable_external_access", "invalid"),
    "Expected boolean string for 'enable_external_access', got 'invalid'",
  );
});

Deno.test("core: validateDatabaseConfig validates complete config", () => {
  const validConfig = {
    path: "test.db",
    accessMode: "read_only",
    threads: "4",
  };
  const result = validateDatabaseConfig(validConfig);
  assertEquals(result.path, "test.db");
});

Deno.test("core: validateDatabaseConfig rejects invalid accessMode", () => {
  assertThrows(
    () => validateDatabaseConfig({ accessMode: "invalid" }),
    Error,
    "Invalid database config",
  );
});
