/**
 * Shared console output helpers for DuckDB examples.
 * Provides consistent styling across all example files.
 */

/**
 * Section headers: "=== Title ==="
 */
export function printSection(title: string): void {
  console.log(`\n=== ${title} ===`);
}

/**
 * Subsection headers: "--- Title ---"
 */
export function printSubsection(title: string): void {
  console.log(`\n--- ${title} ---`);
}

/**
 * Success messages with checkmark
 */
export function printSuccess(message: string): void {
  console.log(`  ✓ ${message}`);
}

/**
 * Tabular data - uses console.table for 2-8 columns
 */
export function printTable(
  rows: readonly Record<string, unknown>[],
  options?: { title?: string; limit?: number },
): void {
  if (rows.length === 0) {
    console.log("No rows returned");
    return;
  }

  if (options?.title) {
    console.log(options.title);
  }

  const limit = options?.limit ?? rows.length;
  const rowsToDisplay = rows.slice(0, limit);
  console.table(rowsToDisplay);
}

/**
 * Custom formatted list (when console.table isn't appropriate)
 */
export function printList<T>(
  items: readonly T[],
  formatter: (item: T) => string,
  options?: { title?: string; limit?: number },
): void {
  if (items.length === 0) {
    console.log("No items");
    return;
  }

  if (options?.title) {
    console.log(options.title);
  }

  const limit = options?.limit ?? items.length;
  const itemsToDisplay = items.slice(0, limit);
  for (const item of itemsToDisplay) {
    console.log(formatter(item));
  }
}
