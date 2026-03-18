/**
 * Configuration validation and type guards.
 *
 * Provides runtime validation for DuckDB configuration options,
 * matching the compile-time type safety from the config schema.
 */

import { configSchema, type KnownConfigKey } from "./schema/mod.ts";
import type { DatabaseConfig } from "../../types.ts";

/**
 * Type guard to check if a string is a known config key.
 */
export function isValidConfigKey(key: string): key is KnownConfigKey {
  return key in configSchema;
}

/**
 * Validate a config value for a given key.
 *
 * @param key - The configuration key
 * @param value - The value to validate
 * @returns Error message if invalid, null if valid
 */
export function validateConfigValue(
  key: string,
  value: unknown,
): string | null {
  // Unknown keys are allowed for backward compatibility
  if (!isValidConfigKey(key)) {
    return null;
  }

  const definition = configSchema[key];
  const type = definition.type;

  if (value === undefined || value === null) {
    return null; // Optional values are allowed
  }

  switch (type) {
    case "boolean": {
      if (typeof value !== "boolean" && typeof value !== "string") {
        return `Expected boolean for '${key}', got ${typeof value}`;
      }
      // Also accept string "true"/"false"
      if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (lower !== "true" && lower !== "false") {
          return `Expected boolean string for '${key}', got '${value}'`;
        }
      }
      return null;
    }

    case "enum": {
      if (typeof value !== "string") {
        return `Expected string for '${key}', got ${typeof value}`;
      }
      const allowed = definition.values.map((v) => v.toLowerCase());
      if (!allowed.includes(value.toLowerCase())) {
        return `Invalid value '${value}' for '${key}'. Allowed: ${
          definition.values.join(", ")
        }`;
      }
      return null;
    }

    case "integer": {
      if (typeof value !== "number" && typeof value !== "string") {
        return `Expected number or string for '${key}', got ${typeof value}`;
      }
      const num = typeof value === "number" ? value : parseInt(value, 10);
      if (isNaN(num)) {
        return `Invalid integer value for '${key}': ${value}`;
      }
      if (definition.min !== undefined && num < definition.min) {
        return `Value ${num} for '${key}' is below minimum ${definition.min}`;
      }
      if (definition.max !== undefined && num > definition.max) {
        return `Value ${num} for '${key}' exceeds maximum ${definition.max}`;
      }
      return null;
    }

    case "bigint": {
      if (
        typeof value !== "string" && typeof value !== "number"
        && typeof value !== "bigint"
      ) {
        return `Expected string, number, or bigint for '${key}', got ${typeof value}`;
      }
      const bigVal = typeof value === "bigint"
        ? value
        : typeof value === "number"
        ? BigInt(value)
        : BigInt(value);
      if (definition.min !== undefined && bigVal < definition.min) {
        return `Value ${bigVal} for '${key}' is below minimum ${definition.min}`;
      }
      if (definition.max !== undefined && bigVal > definition.max) {
        return `Value ${bigVal} for '${key}' exceeds maximum ${definition.max}`;
      }
      return null;
    }

    case "string": {
      if (typeof value !== "string" && typeof value !== "number") {
        return `Expected string for '${key}', got ${typeof value}`;
      }
      return null;
    }

    case "string[]": {
      if (!Array.isArray(value) && typeof value !== "string") {
        return `Expected array or string for '${key}', got ${typeof value}`;
      }
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== "string") {
            return `Expected string at index ${i} for '${key}', got ${typeof value[i]}`;
          }
        }
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Validate a complete database configuration.
 *
 * @param config - The configuration to validate
 * @returns The validated config (or throws on invalid)
 * @throws Error if any config value is invalid
 */
export function validateDatabaseConfig(
  config: unknown,
): DatabaseConfig {
  if (config === undefined || config === null) {
    return {};
  }

  if (typeof config !== "object") {
    throw new Error("Database config must be an object");
  }

  const errors: string[] = [];
  const configObj = config as Record<string, unknown>;

  // Validate accessMode specially (it's an alias)
  if (configObj.accessMode !== undefined) {
    const accessMode = configObj.accessMode;
    if (typeof accessMode !== "string") {
      errors.push("accessMode must be a string");
    } else {
      const normalized = accessMode.toLowerCase();
      if (
        normalized !== "automatic" && normalized !== "read_only"
        && normalized !== "read_write"
      ) {
        errors.push(
          `accessMode must be 'automatic', 'read_only', or 'read_write', got '${accessMode}'`,
        );
      }
    }
  }

  // Validate all other keys
  for (const key of Object.keys(configObj)) {
    if (key === "accessMode") {
      continue; // accessMode is handled specially
    }

    const error = validateConfigValue(key, configObj[key]);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid database config: ${errors.join("; ")}`);
  }

  return configObj as DatabaseConfig;
}

/**
 * Get the type of a config option.
 */
export function getConfigOptionType(key: string): string | undefined {
  const definition = configSchema[key as KnownConfigKey];
  return definition?.type;
}

/**
 * Get the allowed values for an enum config option.
 */
export function getConfigEnumValues(
  key: string,
): readonly string[] | undefined {
  const definition = configSchema[key as KnownConfigKey];
  if (definition?.type === "enum") {
    return definition.values;
  }
  return undefined;
}

/**
 * Get the default value for a config option.
 */
export function getConfigDefault(key: string): unknown {
  const definition = configSchema[key as KnownConfigKey];
  return definition?.default;
}
