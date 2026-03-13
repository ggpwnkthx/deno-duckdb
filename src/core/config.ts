/**
 * Database config normalization.
 */

import type { DatabaseConfig } from "../types.ts";

export interface NormalizedOption {
  name: string;
  value: string;
}

export interface NormalizedDatabaseConfig {
  path: string;
  options: readonly NormalizedOption[];
}

export function normalizeDatabaseConfig(
  config?: DatabaseConfig,
): NormalizedDatabaseConfig {
  const trimmedPath = config?.path?.trim();
  const path = trimmedPath && trimmedPath.length > 0 ? trimmedPath : ":memory:";
  const options: NormalizedOption[] = [];

  if (!config) {
    return { path, options };
  }

  for (const [key, rawValue] of Object.entries(config)) {
    if (key === "path" || rawValue === undefined) {
      continue;
    }

    const trimmedValue = rawValue.trim();
    if (trimmedValue === "") {
      continue;
    }

    let name = key;
    let value = trimmedValue;

    if (key === "accessMode") {
      name = "access_mode";
      const normalized = trimmedValue.toLowerCase();
      if (normalized === "read_only") {
        value = "READ_ONLY";
      } else if (normalized === "read_write") {
        value = "READ_WRITE";
      } else {
        value = trimmedValue.toUpperCase();
      }
    }

    options.push({ name, value });
  }

  options.sort((left, right) => left.name.localeCompare(right.name));

  return { path, options };
}
