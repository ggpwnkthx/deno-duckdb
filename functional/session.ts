/**
 * Per-connection session configuration.
 *
 * Applies `SessionConfig` (DuckDB local/session options) to an open
 * connection by issuing one `SET` statement per option. DuckDB's C API
 * does not expose a per-connection config setter, so `SET name = value`
 * SQL is the supported mechanism for runtime session changes.
 */

import type { ConnectionHandle, ResultHandle } from "../types.ts";
import { QueryError, ValidationError } from "../errors.ts";
import { escapeSqlStringLiteral, serializeConfigValue } from "../core/config/mod.ts";
import type { SessionConfig } from "../core/config/schema/mod.ts";
import { localConfigSchema } from "../core/config/schema/local.ts";
import { validateSessionConfig } from "../core/config/validate.ts";
import { validateConnectionHandle } from "../core/handles.ts";
import { destroy, executeQueryResult } from "./native.ts";

/**
 * Apply a validated session configuration to an open connection.
 *
 * Each known option is applied via `SET "<name>" = '<value>'`. Unknown keys
 * and value-type mismatches throw `ValidationError` before any `SET` is
 * issued. If one or more `SET` statements fail, the remaining options are
 * still attempted, then a single `QueryError` is thrown whose `context`
 * lists every failed option and its error message.
 *
 * @param handle - An open connection handle
 * @param config - Session/local DuckDB settings to apply
 * @throws {ValidationError} if `config` contains unknown keys or invalid values
 * @throws {QueryError} if any of the underlying `SET` statements fails
 *
 * @example
 * ```ts
 * import { applySessionConfig, openDatabase, connectToDatabase } from "@ggpwnkthx/duckdb/functional";
 *
 * const db = await openDatabase();
 * const conn = await connectToDatabase(db);
 * try {
 *   applySessionConfig(conn, { search_path: ["main", "analytics"] });
 * } finally {
 *   // caller is responsible for closing the connection and database
 * }
 * ```
 */
export function applySessionConfig(
  handle: ConnectionHandle,
  config: SessionConfig,
): void {
  validateConnectionHandle(handle);
  const validated = validateSessionConfig(config);

  const statements: string[] = [];
  const options: Array<{ name: string; value: string }> = [];

  for (const [name, rawValue] of Object.entries(validated)) {
    const serialized = serializeConfigValue(rawValue);
    if (serialized === null) {
      continue;
    }
    if (!(name in localConfigSchema)) {
      throw new ValidationError(
        `Unknown session config key '${name}' - not a valid local option`,
        { name },
      );
    }
    const sql = `SET ${name} = ${escapeSqlStringLiteral(serialized)}`;
    statements.push(sql);
    options.push({ name, value: serialized });
  }

  const failures: Array<{ key: string; message: string }> = [];

  for (let i = 0; i < statements.length; i += 1) {
    const sql = statements[i];
    const option = options[i];
    let result: ResultHandle | null = null;
    try {
      result = executeQueryResult(handle, sql);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      failures.push({ key: option.name, message });
    } finally {
      if (result !== null) {
        destroy(result);
      }
    }
  }

  if (failures.length > 0) {
    const failedKeys = failures.map((f) => f.key).join(", ");
    const detail = failures
      .map((f) => `'${f.key}': ${f.message}`)
      .join("; ");
    throw new QueryError(
      `Failed to apply session config for option(s): ${failedKeys} (${detail})`,
      statements.join("; "),
      { errors: failures },
    );
  }
}
