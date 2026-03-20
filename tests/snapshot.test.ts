/**
 * Snapshot testing utilities for comparing complex data structures.
 *
 * Provides functions for creating and comparing snapshots of test data.
 * Snapshots are stored in `.snap` files alongside the test files.
 *
 * @example
 * ```ts
 * import { assertSnapshot } from "./snapshot.ts";
 *
 * test("example test", () => {
 *   const result = someFunction();
 *   assertSnapshot(t, result, "example-test-output");
 * });
 * ```
 */

/**
 * Options for snapshot assertions.
 */
export interface SnapshotOptions {
  /** Directory to store snapshots (defaults to "__snapshots__" alongside test file) */
  dir?: string;
  /** Update existing snapshots instead of failing */
  update?: boolean;
}

/**
 * Assert that a value matches its stored snapshot.
 *
 * If no snapshot exists, it will be created. If the value doesn't match,
 * the test will fail. Use the `update` option to update existing snapshots.
 *
 * @param t - The test context (from Deno.test)
 * @param value - The value to compare
 * @param name - Snapshot name (should be unique within the test file)
 * @param options - Snapshot options
 */
export function assertSnapshot<T>(
  t: Deno.TestContext,
  value: T,
  name: string,
  options?: SnapshotOptions,
): void {
  const testFile = t.origin;
  const snapshotDir = options?.dir
    ? options.dir
    : testFile.replace(/\/[^/]+$/, "/__snapshots__");
  const snapshotFile = `${snapshotDir}/${t.name.replace(/[^a-zA-Z0-9]/g, "_")}.snap`;

  const serialized = serializeSnapshot(value);

  try {
    const existing = Deno.readTextFileSync(snapshotFile);
    const snapshots = parseSnapshots(existing);
    const expected = snapshots[name];

    if (expected === undefined) {
      saveSnapshot(snapshotFile, name, serialized, snapshots);
      const error = new Error(
        `Snapshot "${name}" not found. Created snapshot at ${snapshotFile}`,
      );
      error.name = "SnapshotNotFound";
      throw error;
    }

    if (expected !== serialized) {
      const error = new SnapshotAssertionError(
        `Snapshot "${name}" does not match.\n\nExpected:\n${expected}\n\nActual:\n${serialized}`,
      );
      throw error;
    }
  } catch (e) {
    if (e instanceof Error && e.name === "SnapshotNotFound") {
      if (options?.update) {
        saveSnapshot(snapshotFile, name, serialized, {});
        return;
      }
      throw e;
    }
    if (e instanceof SnapshotAssertionError) {
      if (options?.update) {
        saveSnapshot(snapshotFile, name, serialized, {});
        return;
      }
      throw e;
    }
    if (e instanceof Deno.errors.NotFound) {
      saveSnapshot(snapshotFile, name, serialized, {});
      return;
    }
    throw e;
  }
}

function serializeSnapshot(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "function") return "[Function]";
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Error) {
    return `Error: ${value.message}`;
  }
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "symbol") return value.toString();
  if (value instanceof Uint8Array) {
    return `Uint8Array(${JSON.stringify(Array.from(value))})`;
  }
  if (Array.isArray(value)) {
    const items = value.map(serializeSnapshot).join(", ");
    return `[${items}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const items = entries
      .map(([k, v]) => `"${k}": ${serializeSnapshot(v)}`)
      .join(", ");
    return `{${items}}`;
  }
  return JSON.stringify(value);
}

function parseSnapshots(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");
  let currentKey: string | null = null;
  let currentValue: string[] = [];

  for (const line of lines) {
    if (line.startsWith('"') && line.includes(":")) {
      if (currentKey !== null) {
        result[currentKey] = currentValue.join("\n");
      }
      const colonIdx = line.indexOf(":");
      currentKey = line.slice(1, colonIdx - 1);
      currentValue = [line.slice(colonIdx + 2)];
    } else if (currentKey !== null) {
      currentValue.push(line);
    }
  }

  if (currentKey !== null) {
    result[currentKey] = currentValue.join("\n");
  }

  return result;
}

function saveSnapshot(
  filePath: string,
  name: string,
  serialized: string,
  existing: Record<string, string>,
): void {
  existing[name] = serialized;

  const dir = filePath.replace(/\/[^/]+$/, "");
  Deno.mkdirSync(dir, { recursive: true });

  const content = Object.entries(existing)
    .map(([key, value]) => `"${key}": ${value}`)
    .join("\n\n");

  Deno.writeTextFileSync(filePath, content);
}

class SnapshotAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotAssertionError";
  }
}
