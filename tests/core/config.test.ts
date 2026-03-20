import { assertEquals, assertThrows } from "@std/assert";
import { configToFFI, getConfigDefinition } from "../../src/core/config/mod.ts";
import {
  getGlobalConfigDefinition,
  getLocalConfigDefinition,
  isKnownConfigKey,
  isKnownGlobalConfigKey,
  isKnownLocalConfigKey,
} from "../../src/core/config/schema/mod.ts";
import {
  getConfigDefault,
  getConfigEnumValues,
  getConfigOptionType,
  isValidConfigKey,
  validateConfigOption,
  validateConfigValue,
  validateDatabaseConfig,
  validateDatabaseOpenConfig,
  validateSessionConfig,
} from "../../src/core/config/validate.ts";

// === configToFFI Tests ===

for (
  const [name, path, config, expectedPath, expectedOptions] of [
    [
      "trims path and normalizes options",
      "  app.db  ",
      { access_mode: "READ_ONLY", threads: 4n },
      "app.db",
      [{ name: "access_mode", value: "READ_ONLY" }, { name: "threads", value: "4" }],
    ],
    ["normalizes access_mode key", "app.db", { access_mode: "READ_ONLY" }, "app.db", [{
      name: "access_mode",
      value: "READ_ONLY",
    }]],
    ["falls back to in-memory defaults", undefined, {}, ":memory:", []],
    [
      "handles boolean config values",
      "app.db",
      { enable_external_access: true },
      "app.db",
      [{ name: "enable_external_access", value: "true" }],
    ],
    ["handles bigint config values", "app.db", { threads: 8n }, "app.db", [{
      name: "threads",
      value: "8",
    }]],
    [
      "handles number config values",
      "app.db",
      { checkpoint_threshold: 42.5 },
      "app.db",
      [{ name: "checkpoint_threshold", value: "42.5" }],
    ],
    [
      "handles array config values",
      "app.db",
      { search_path: ["schema1", "schema2"] },
      "app.db",
      [{ name: "search_path", value: "schema1,schema2" }],
    ],
    [
      "skips null and undefined config values",
      "app.db",
      { access_mode: null, threads: undefined },
      "app.db",
      [],
    ],
    [
      "normalizes enum values case-insensitively",
      "app.db",
      { access_mode: "read_only" },
      "app.db",
      [{ name: "access_mode", value: "READ_ONLY" }],
    ],
  ] as [
    string,
    string | undefined,
    Record<string, unknown>,
    string,
    { name: string; value: string }[],
  ][]
) {
  Deno.test(`core: configToFFI ${name}`, () => {
    const normalized = configToFFI(path, config as Parameters<typeof configToFFI>[1]);
    assertEquals(normalized.path, expectedPath);
    assertEquals(normalized.options, expectedOptions);
  });
}

// === Config Schema Tests ===

for (
  const [key, expected] of [
    ["access_mode", true],
    ["threads", true],
    ["max_memory", true],
    ["unknown_option", false],
  ] as [string, boolean][]
) {
  Deno.test(`core: isValidConfigKey returns ${expected} for "${key}"`, () => {
    assertEquals(isValidConfigKey(key), expected);
  });
}

for (
  const [key, expected] of [
    ["access_mode", "enum"],
    ["threads", "bigint"],
    ["enable_external_access", "boolean"],
    ["max_memory", "string"],
    ["temp_directory", "string"],
  ] as [string, string][]
) {
  Deno.test(`core: getConfigOptionType returns "${expected}" for "${key}"`, () => {
    assertEquals(getConfigOptionType(key), expected);
  });
}

Deno.test("core: getConfigEnumValues returns allowed values for enum options", () => {
  assertEquals(getConfigEnumValues("access_mode"), [
    "AUTOMATIC",
    "READ_ONLY",
    "READ_WRITE",
  ]);
});

for (
  const [key, value, expected] of [
    ["access_mode", "READ_ONLY", null],
    [
      "access_mode",
      "invalid",
      "Invalid value 'invalid' for 'access_mode'. Allowed: AUTOMATIC, READ_ONLY, READ_WRITE",
    ],
    ["threads", "4", null],
    ["threads", "-1", "Value -1 for 'threads' is below minimum 0"],
    ["threads", "1000", "Value 1000 for 'threads' exceeds maximum 256"],
    ["enable_external_access", "true", null],
    ["enable_external_access", "false", null],
    [
      "enable_external_access",
      "invalid",
      "Expected boolean string for 'enable_external_access', got 'invalid'",
    ],
    ["enable_external_access", true, null],
    ["enable_external_access", false, null],
    [
      "enable_external_access",
      123,
      "Expected boolean for 'enable_external_access', got number",
    ],
    ["http_retry_backoff", 4.5, null],
    ["http_retry_backoff", NaN, "Invalid double value for 'http_retry_backoff': NaN"],
    ["index_scan_percentage", 50.0, null],
    [
      "index_scan_percentage",
      -1,
      "Value -1 for 'index_scan_percentage' is below minimum 0",
    ],
    [
      "index_scan_percentage",
      101,
      "Value 101 for 'index_scan_percentage' exceeds maximum 100",
    ],
    ["threads", 4n, null],
    ["threads", 4, null],
    ["threads", "4", null],
    ["threads", "not_a_number", "Invalid bigint value for 'threads': not_a_number"],
    ["http_retry_wait_ms", 100n, null],
    ["http_retry_wait_ms", -1n, "Value -1 for 'http_retry_wait_ms' is below minimum 0"],
    [
      "http_retry_wait_ms",
      9223372036854775807n + 1n,
      `Value 9223372036854775808 for 'http_retry_wait_ms' exceeds maximum 9223372036854775807`,
    ],
    ["search_path", ["a", "b"], null],
    ["search_path", "single_value", null],
    ["search_path", [1, 2], "Expected string at index 0 for 'search_path', got number"],
    ["search_path", 123, "Expected array or string for 'search_path', got number"],
    [
      "search_path",
      { not: "an array" },
      "Expected array or string for 'search_path', got object",
    ],
    ["temp_directory", "/tmp", null],
    ["temp_directory", 123, null],
    ["temp_directory", false, "Expected string for 'temp_directory', got boolean"],
  ] as [string, unknown, string | null][]
) {
  const valueStr = typeof value === "bigint" ? `${value}n` : JSON.stringify(value);
  Deno.test(`core: validateConfigValue "${key}" with ${valueStr}`, () => {
    assertEquals(
      validateConfigValue(key, value as Parameters<typeof validateConfigValue>[1]),
      expected,
    );
  });
}

Deno.test("core: validateDatabaseConfig validates complete config", () => {
  const validConfig = { access_mode: "READ_ONLY", threads: 4n };
  const result = validateDatabaseConfig(validConfig);
  assertEquals(result.access_mode, "READ_ONLY");
});

// === Config Alias Tests ===

for (
  const [aliasKey, primaryKey, expectedType] of [
    ["memory_limit", "max_memory", "string"],
    ["worker_threads", "threads", "bigint"],
    ["null_order", "default_null_order", "enum"],
  ] as [string, string, string][]
) {
  Deno.test(`core: getConfigDefinition resolves "${aliasKey}" to "${primaryKey}"`, () => {
    const def = getConfigDefinition(aliasKey);
    assertEquals(def?.aliases?.includes(aliasKey), true);
    assertEquals(def?.type, expectedType);
  });
}

for (
  const [name, fn, key, expectedType] of [
    [
      "getConfigDefinition returns definition for primary keys",
      getConfigDefinition,
      "threads",
      "bigint",
    ],
    [
      "getGlobalConfigDefinition resolves aliases to primary keys",
      getGlobalConfigDefinition,
      "worker_threads",
      "bigint",
    ],
    [
      "getGlobalConfigDefinition returns definition for primary keys",
      getGlobalConfigDefinition,
      "threads",
      "bigint",
    ],
  ] as [string, (k: string) => ReturnType<typeof getConfigDefinition>, string, string][]
) {
  Deno.test(`core: ${name}`, () => {
    const def = fn(key);
    assertEquals(def !== undefined, true);
    assertEquals(def?.type, expectedType);
  });
}

for (
  const [fn, key] of [
    [getConfigDefinition, "unknown_key"],
    [getGlobalConfigDefinition, "unknown_key"],
  ] as [((k: string) => ReturnType<typeof getConfigDefinition>), string][]
) {
  Deno.test(`core: ${fn.name} returns undefined for unknown keys`, () => {
    assertEquals(fn(key), undefined);
  });
}

Deno.test("core: configToFFI normalizes alias keys to primary keys", () => {
  const normalized = configToFFI("app.db", { max_memory: "2GB", threads: 4n });
  assertEquals(normalized.options, [{ name: "max_memory", value: "2GB" }, {
    name: "threads",
    value: "4",
  }]);
});

// === validateDatabaseOpenConfig Tests ===

Deno.test("core: validateDatabaseOpenConfig accepts only global options", () => {
  const config = { access_mode: "READ_ONLY" as const, threads: 4n };
  const result = validateDatabaseOpenConfig(config);
  assertEquals(result.access_mode, "READ_ONLY");
  assertEquals(result.threads, 4n);
});

for (
  const [name, config] of [
    ["rejects local options", { access_mode: "READ_ONLY", search_path: ["schema1"] }],
    ["rejects unknown keys", { unknown_global_option: "value" }],
  ] as [string, Record<string, unknown>][]
) {
  Deno.test(`core: validateDatabaseOpenConfig ${name}`, () => {
    assertThrows(
      () =>
        validateDatabaseOpenConfig(
          config as Parameters<typeof validateDatabaseOpenConfig>[0],
        ),
      Error,
      "Unknown config key",
    );
  });
}

for (
  const [name, input, expected] of [
    ["handles null/undefined input", null, {}],
    ["handles null/undefined input", undefined, {}],
  ] as [string, null | undefined, Record<string, never>][]
) {
  Deno.test(`core: validateDatabaseOpenConfig ${name}`, () => {
    assertEquals(
      validateDatabaseOpenConfig(
        input as Parameters<typeof validateDatabaseOpenConfig>[0],
      ),
      expected,
    );
  });
}

for (const input of ["not an object", 123] as unknown[]) {
  Deno.test(`core: validateDatabaseOpenConfig throws for non-object input`, () => {
    assertThrows(
      () =>
        validateDatabaseOpenConfig(
          input as Parameters<typeof validateDatabaseOpenConfig>[0],
        ),
      Error,
      "Database config must be an object",
    );
  });
}

// === validateSessionConfig Tests ===

Deno.test("core: validateSessionConfig accepts only local options", () => {
  const config = { search_path: ["schema1", "schema2"], schema: "my_schema" };
  const result = validateSessionConfig(config);
  assertEquals(result.search_path, ["schema1", "schema2"]);
  assertEquals(result.schema, "my_schema");
});

for (
  const [name, config] of [
    ["rejects global options", { search_path: ["schema1"], access_mode: "READ_ONLY" }],
    ["rejects invalid search_path values", { search_path: 123 }],
    ["rejects unknown keys", { unknown_session_option: "value" }],
  ] as [string, Record<string, unknown>][]
) {
  Deno.test(`core: validateSessionConfig ${name}`, () => {
    assertThrows(
      () =>
        validateSessionConfig(config as Parameters<typeof validateSessionConfig>[0]),
      Error,
      name.startsWith("rejects invalid")
        ? "Invalid session config"
        : "Unknown config key",
    );
  });
}

for (
  const [name, input, expected] of [
    ["handles null/undefined input", null, {}],
    ["handles null/undefined input", undefined, {}],
  ] as [string, null | undefined, Record<string, never>][]
) {
  Deno.test(`core: validateSessionConfig ${name}`, () => {
    assertEquals(
      validateSessionConfig(input as Parameters<typeof validateSessionConfig>[0]),
      expected,
    );
  });
}

for (const input of ["not an object", 123] as unknown[]) {
  Deno.test(`core: validateSessionConfig throws for non-object input`, () => {
    assertThrows(
      () => validateSessionConfig(input as Parameters<typeof validateSessionConfig>[0]),
      Error,
      "Session config must be an object",
    );
  });
}

// === getConfigDefault Tests ===

for (
  const [key, expected] of [
    ["access_mode", "AUTOMATIC"],
    ["threads", 0n],
    ["enable_external_access", true],
    ["max_memory", "80%"],
    ["unknown_key", undefined],
  ] as [string, unknown][]
) {
  const expectedStr = typeof expected === "bigint"
    ? `${expected}n`
    : JSON.stringify(expected);
  Deno.test(`core: getConfigDefault returns ${expectedStr} for "${key}"`, () => {
    assertEquals(getConfigDefault(key), expected);
  });
}

// === validateConfigOption Tests ===

for (
  const [name, key, option] of [
    ["validates boolean config option", "enable_external_access", {
      type: "boolean",
      default: "not_boolean",
    }],
    ["validates integer config option", "perfect_ht_threshold", {
      type: "integer",
      default: "not_number",
    }],
    ["validates bigint config option", "threads", { type: "bigint", default: 42 }],
    ["validates double config option", "http_retry_backoff", {
      type: "double",
      default: "not_number",
    }],
    ["validates string config option", "temp_directory", {
      type: "string",
      default: 123,
    }],
  ] as [string, string, Record<string, unknown>][]
) {
  Deno.test(`core: validateConfigOption ${name}`, () => {
    assertThrows(
      () =>
        validateConfigOption(key, option as Parameters<typeof validateConfigOption>[1]),
      Error,
      "missing required",
    );
  });
}

Deno.test("core: validateConfigOption validates enum config option", () => {
  assertThrows(
    () =>
      validateConfigOption(
        "access_mode",
        { type: "enum", default: 123 } as Parameters<typeof validateConfigOption>[1],
      ),
    Error,
    "missing required 'values' field",
  );
  assertThrows(
    () =>
      validateConfigOption(
        "access_mode",
        { type: "enum", values: ["A", "B"], default: "C" } as Parameters<
          typeof validateConfigOption
        >[1],
      ),
    Error,
    "invalid default value",
  );
});

Deno.test("core: validateConfigOption validates string[] config option", () => {
  assertThrows(
    () =>
      validateConfigOption(
        "search_path",
        { type: "string[]", default: "not_array" } as Parameters<
          typeof validateConfigOption
        >[1],
      ),
    Error,
    "missing required 'default: readonly string[]' field",
  );
});

for (const input of [null, undefined] as unknown[]) {
  Deno.test(`core: validateConfigOption throws for null/undefined input`, () => {
    assertThrows(
      () =>
        validateConfigOption(
          "threads",
          input as Parameters<typeof validateConfigOption>[1],
        ),
      Error,
      "is null or undefined",
    );
  });
}

Deno.test("core: validateConfigOption rejects unknown types", () => {
  assertThrows(
    () =>
      validateConfigOption(
        "unknown",
        { type: "unknown_type", default: null } as Parameters<
          typeof validateConfigOption
        >[1],
      ),
    Error,
    "Unknown config option type",
  );
});

// === Config Schema Type Guard Tests ===

for (
  const [fn, key, expected] of [
    [isKnownGlobalConfigKey, "access_mode", true],
    [isKnownGlobalConfigKey, "threads", true],
    [isKnownGlobalConfigKey, "max_memory", true],
    [isKnownGlobalConfigKey, "search_path", false],
    [isKnownLocalConfigKey, "search_path", true],
    [isKnownLocalConfigKey, "schema", true],
    [isKnownLocalConfigKey, "access_mode", false],
    [isKnownConfigKey, "access_mode", true],
    [isKnownConfigKey, "threads", true],
    [isKnownConfigKey, "search_path", true],
    [isKnownConfigKey, "schema", true],
    [isKnownConfigKey, "unknown_key", false],
  ] as [((k: string) => boolean), string, boolean][]
) {
  Deno.test(`core: ${fn.name} returns ${expected} for "${key}"`, () => {
    assertEquals(fn(key), expected);
  });
}

Deno.test("core: getLocalConfigDefinition returns definition for local keys", () => {
  const searchPathDef = getLocalConfigDefinition("search_path");
  assertEquals(searchPathDef !== undefined, true);
  assertEquals(searchPathDef?.type, "string[]");

  const schemaDef = getLocalConfigDefinition("schema");
  assertEquals(schemaDef !== undefined, true);
  assertEquals(schemaDef?.type, "string");
});

Deno.test("core: getLocalConfigDefinition returns undefined for global keys", () => {
  assertEquals(getLocalConfigDefinition("access_mode"), undefined);
  assertEquals(getLocalConfigDefinition("threads"), undefined);
  assertEquals(getLocalConfigDefinition("unknown_key"), undefined);
});
