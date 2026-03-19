/**
 * Materialization limits configuration.
 *
 * Provides guardrails to prevent unbounded memory allocation when
 * eagerly materializing query results with toArray(), query(), etc.
 */

import { ValidationError } from "../../errors.ts";

/**
 * Default maximum number of rows to materialize.
 * Setting to 1,000,000 rows provides reasonable protection while
 * still allowing most typical query results.
 */
export const DEFAULT_MAX_ROWS = 1_000_000;

/**
 * Default maximum bytes per row before falling back to text.
 * Setting to 100MB per row provides protection against extremely
 * wide columns (e.g., uncompressed JSON, long strings).
 */
export const DEFAULT_MAX_BYTES_PER_ROW = 100 * 1024 * 1024; // 100MB

/**
 * Maximum reasonable string/blob length in bytes.
 * Values exceeding this are treated as corrupted or invalid.
 * Setting to 1TB as an extreme upper bound.
 */
export const MAX_REASONABLE_STRING_LENGTH = 1024n * 1024n * 1024n * 1024n; // 1TB

/**
 * Configuration options for materialization limits.
 */
export interface MaterializationLimits {
  /**
   * Maximum number of rows to materialize.
   * @default DEFAULT_MAX_ROWS (1,000,000)
   */
  maxRows?: number;

  /**
   * Maximum bytes per row before triggering text fallback.
   * @default DEFAULT_MAX_BYTES_PER_ROW (100MB)
   */
  maxBytesPerRow?: number;
}

/**
 * Validate materialization limits configuration.
 *
 * @param limits - The limits to validate
 * @throws {ValidationError} if limits are invalid
 */
export function validateMaterializationLimits(
  limits: MaterializationLimits,
): void {
  if (limits.maxRows !== undefined) {
    if (!Number.isInteger(limits.maxRows) || limits.maxRows < 1) {
      throw new ValidationError("maxRows must be a positive integer", {
        received: limits.maxRows,
      });
    }
  }

  if (limits.maxBytesPerRow !== undefined) {
    if (!Number.isInteger(limits.maxBytesPerRow) || limits.maxBytesPerRow < 1) {
      throw new ValidationError("maxBytesPerRow must be a positive integer", {
        received: limits.maxBytesPerRow,
      });
    }
  }
}

/**
 * Get effective limits with defaults applied.
 *
 * @param limits - The limits (may be partial)
 * @returns Full limits with defaults applied
 */
export function getEffectiveLimits(
  limits?: MaterializationLimits,
): Required<MaterializationLimits> {
  return {
    maxRows: limits?.maxRows ?? DEFAULT_MAX_ROWS,
    maxBytesPerRow: limits?.maxBytesPerRow ?? DEFAULT_MAX_BYTES_PER_ROW,
  };
}

/**
 * Check if a row count exceeds the configured limit.
 *
 * @param rowCount - Number of rows to check
 * @param maxRows - Maximum allowed rows
 * @throws {ValidationError} if rowCount exceeds maxRows
 */
export function checkRowCountLimit(rowCount: number, maxRows: number): void {
  if (rowCount > maxRows) {
    throw new ValidationError(
      `Row count ${rowCount} exceeds the configured limit of ${maxRows}. `
        + "Use streaming iteration (result.rows()) or increase the maxRows limit.",
      { rowCount, maxRows },
    );
  }
}

/**
 * Check if a string/blob length exceeds the maximum reasonable length.
 *
 * @param length - Length in bytes
 * @throws {ValidationError} if length exceeds MAX_REASONABLE_STRING_LENGTH
 */
export function checkStringLengthLimit(length: bigint): void {
  if (length > MAX_REASONABLE_STRING_LENGTH) {
    throw new ValidationError(
      `String/blob length ${length} exceeds maximum reasonable length. `
        + "This may indicate corrupted data.",
      { length: length.toString(), maxLength: MAX_REASONABLE_STRING_LENGTH.toString() },
    );
  }
}
