/**
 * Centralized validation for untrusted inputs.
 *
 * Provides assertion functions for validating user input and parameters
 * before passing to FFI calls. All functions throw ValidationError on failure.
 */

import { ValidationError } from "../errors.ts";

/**
 * Assert a value is a non-empty string.
 *
 * @param value - Value to validate
 * @param label - Human-readable label for error messages
 * @returns Trimmed string value
 * @throws {ValidationError} if value is not a non-empty string
 */
export function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${label} cannot be empty`, {
      label,
      receivedType: typeof value,
    });
  }

  return value.trim();
}

/**
 * Assert a number is a safe integer.
 *
 * Safe integers are all integers between -(2^53 - 1) and 2^53 - 1.
 *
 * @param value - Number to validate
 * @param label - Human-readable label for error messages
 * @throws {ValidationError} if value is not a safe integer
 */
export function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new ValidationError(`${label} must be a safe integer`, {
      label,
      value,
    });
  }
}

/**
 * Assert a number is finite (not Infinity or NaN).
 *
 * @param value - Number to validate
 * @param label - Human-readable label for error messages
 * @throws {ValidationError} if value is not finite
 */
export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${label} must be finite`, {
      label,
      value,
    });
  }
}

/**
 * Assert a number is a valid array/object index.
 *
 * @param value - Number to validate
 * @param label - Human-readable label for error messages
 * @param upperExclusive - Upper bound (exclusive) for valid indices
 * @throws {ValidationError} if value is not a valid index
 */
export function assertIntegerIndex(
  value: number,
  label: string,
  upperExclusive: number,
): void {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${label} must be an integer`, {
      label,
      value,
    });
  }

  if (value < 0 || value >= upperExclusive) {
    throw new ValidationError(
      `${label} ${value} is out of bounds (valid range: 0-${upperExclusive - 1})`,
      {
        label,
        value,
        upperExclusive,
      },
    );
  }
}
