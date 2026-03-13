/**
 * Centralized validation for untrusted inputs.
 */

import { ValidationError } from "../errors.ts";

export function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${label} cannot be empty`, {
      label,
      receivedType: typeof value,
    });
  }

  return value.trim();
}

export function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new ValidationError(`${label} must be a safe integer`, {
      label,
      value,
    });
  }
}

export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${label} must be finite`, {
      label,
      value,
    });
  }
}

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
