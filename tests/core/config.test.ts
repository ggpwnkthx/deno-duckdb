import { assertEquals } from "@std/assert";
import { configToFFI, getConfigDefinition } from "../../src/core/config/mod.ts";
import {
  getConfigEnumValues,
  getConfigOptionType,
  isValidConfigKey,
  validateConfigValue,
  validateDatabaseConfig,
} from "../../src/core/config/validate.ts";

// === configToFFI Tests ===

Deno.test("core: configToFFI trims path and normalizes options", () => {
  const normalized = configToFFI("  app.db  ", {
    access_mode: "READ_ONLY",
    threads: 4n,
  });

  assertEquals(normalized.path, "app.db");
  assertEquals(normalized.options, [
    { name: "access_mode", value: "READ_ONLY" },
    { name: "threads", value: "4" },
  ]);
});

Deno.test("core: configToFFI normalizes access_mode key", () => {
  const normalized = configToFFI("app.db", {
    access_mode: "READ_ONLY",
  });

  assertEquals(normalized.path, "app.db");
  assertEquals(normalized.options, [
    { name: "access_mode", value: "READ_ONLY" },
  ]);
});

Deno.test("core: configToFFI falls back to in-memory defaults", () => {
  const normalized = configToFFI();

  assertEquals(normalized.path, ":memory:");
  assertEquals(normalized.options, []);
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
  assertEquals(getConfigOptionType("threads"), "bigint");
  assertEquals(getConfigOptionType("enable_external_access"), "boolean");
  assertEquals(getConfigOptionType("max_memory"), "string");
  assertEquals(getConfigOptionType("temp_directory"), "string");
});

Deno.test("core: getConfigEnumValues returns allowed values for enum options", () => {
  const accessModeValues = getConfigEnumValues("access_mode");
  assertEquals(accessModeValues, ["AUTOMATIC", "READ_ONLY", "READ_WRITE"]);
});

Deno.test("core: validateConfigValue validates enum values", () => {
  assertEquals(validateConfigValue("access_mode", "READ_ONLY"), null);
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
    access_mode: "READ_ONLY",
    threads: 4n,
  };
  const result = validateDatabaseConfig(validConfig);
  assertEquals(result.access_mode, "READ_ONLY");
});

// === Config Alias Tests ===

Deno.test("core: getConfigDefinition resolves aliases to definitions with matching aliases", () => {
  // memory_limit is an alias for max_memory
  const maxMemoryDef = getConfigDefinition("memory_limit");
  assertEquals(maxMemoryDef?.aliases?.includes("memory_limit"), true);

  // threads is a primary key with alias worker_threads
  const threadsDef = getConfigDefinition("threads");
  assertEquals(threadsDef?.aliases?.includes("worker_threads"), true);

  // null_order is an alias for default_null_order
  const nullOrderDef = getConfigDefinition("null_order");
  assertEquals(nullOrderDef?.aliases?.includes("null_order"), true);
});

Deno.test("core: getConfigDefinition returns definition for primary keys", () => {
  const threadsDef = getConfigDefinition("threads");
  assertEquals(threadsDef !== undefined, true);
  assertEquals(threadsDef?.type, "bigint");
});

Deno.test("core: getConfigDefinition returns undefined for unknown keys", () => {
  assertEquals(getConfigDefinition("unknown_key"), undefined);
});

Deno.test("core: configToFFI normalizes alias keys to primary keys", () => {
  const normalized = configToFFI("app.db", {
    max_memory: "2GB",
    threads: 4n,
  });

  // memory_limit -> max_memory (alias resolution)
  // worker_threads -> threads (alias resolution)
  assertEquals(normalized.options, [
    { name: "max_memory", value: "2GB" },
    { name: "threads", value: "4" },
  ]);
});
