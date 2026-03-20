import { assertEquals, assertThrows } from "@std/assert";
import {
  checkRowCountLimit,
  checkStringLengthLimit,
  DEFAULT_MAX_BYTES_PER_ROW,
  DEFAULT_MAX_ROWS,
  getEffectiveLimits,
  validateMaterializationLimits,
} from "../../../src/core/config/limits.ts";
import { ValidationError } from "../../../src/errors.ts";

Deno.test("core: validateMaterializationLimits accepts valid limits", () => {
  validateMaterializationLimits({});
  validateMaterializationLimits({ maxRows: 1000 });
  validateMaterializationLimits({ maxBytesPerRow: 1024 });
  validateMaterializationLimits({ maxRows: 1000, maxBytesPerRow: 1024 });
});

Deno.test("core: validateMaterializationLimits rejects non-integer maxRows", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxRows: 1.5 }),
    ValidationError,
    "maxRows must be a positive integer",
  );
  assertThrows(
    () => validateMaterializationLimits({ maxRows: NaN }),
    ValidationError,
    "maxRows must be a positive integer",
  );
});

Deno.test("core: validateMaterializationLimits rejects zero maxRows", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxRows: 0 }),
    ValidationError,
    "maxRows must be a positive integer",
  );
});

Deno.test("core: validateMaterializationLimits rejects negative maxRows", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxRows: -1 }),
    ValidationError,
    "maxRows must be a positive integer",
  );
});

Deno.test("core: validateMaterializationLimits rejects non-integer maxBytesPerRow", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxBytesPerRow: 1.5 }),
    ValidationError,
    "maxBytesPerRow must be a positive integer",
  );
  assertThrows(
    () => validateMaterializationLimits({ maxBytesPerRow: NaN }),
    ValidationError,
    "maxBytesPerRow must be a positive integer",
  );
});

Deno.test("core: validateMaterializationLimits rejects zero maxBytesPerRow", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxBytesPerRow: 0 }),
    ValidationError,
    "maxBytesPerRow must be a positive integer",
  );
});

Deno.test("core: validateMaterializationLimits rejects negative maxBytesPerRow", () => {
  assertThrows(
    () => validateMaterializationLimits({ maxBytesPerRow: -1 }),
    ValidationError,
    "maxBytesPerRow must be a positive integer",
  );
});

Deno.test("core: getEffectiveLimits returns defaults when no limits provided", () => {
  const limits = getEffectiveLimits();
  assertEquals(limits.maxRows, DEFAULT_MAX_ROWS);
  assertEquals(limits.maxBytesPerRow, DEFAULT_MAX_BYTES_PER_ROW);
});

Deno.test("core: getEffectiveLimits applies partial limits", () => {
  const limits1 = getEffectiveLimits({ maxRows: 5000 });
  assertEquals(limits1.maxRows, 5000);
  assertEquals(limits1.maxBytesPerRow, DEFAULT_MAX_BYTES_PER_ROW);

  const limits2 = getEffectiveLimits({ maxBytesPerRow: 1024 });
  assertEquals(limits2.maxRows, DEFAULT_MAX_ROWS);
  assertEquals(limits2.maxBytesPerRow, 1024);
});

Deno.test("core: checkRowCountLimit does not throw for valid row count", () => {
  checkRowCountLimit(100, 1000);
  checkRowCountLimit(1000, 1000);
  checkRowCountLimit(0, 1000);
});

Deno.test("core: checkRowCountLimit throws when row count exceeds maxRows", () => {
  assertThrows(
    () => checkRowCountLimit(1001, 1000),
    ValidationError,
    "Row count 1001 exceeds the configured limit of 1000",
  );
  assertThrows(
    () => checkRowCountLimit(2000, 1000),
    ValidationError,
    "Row count 2000 exceeds the configured limit of 1000",
  );
});

Deno.test("core: checkStringLengthLimit does not throw for valid length", () => {
  checkStringLengthLimit(0n);
  checkStringLengthLimit(1000n);
  checkStringLengthLimit(1024n * 1024n); // 1MB
});

Deno.test("core: checkStringLengthLimit throws when length exceeds 1TB", () => {
  const oneTB = 1024n * 1024n * 1024n * 1024n;
  assertThrows(
    () => checkStringLengthLimit(oneTB + 1n),
    ValidationError,
    "exceeds maximum reasonable length",
  );
  assertThrows(
    () => checkStringLengthLimit(oneTB * 2n),
    ValidationError,
    "exceeds maximum reasonable length",
  );
});

Deno.test("core: DEFAULT_MAX_ROWS is 1000000", () => {
  assertEquals(DEFAULT_MAX_ROWS, 1_000_000);
});

Deno.test("core: DEFAULT_MAX_BYTES_PER_ROW is 100MB", () => {
  assertEquals(DEFAULT_MAX_BYTES_PER_ROW, 100 * 1024 * 1024);
});
