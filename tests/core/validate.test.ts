import { assertEquals, assertThrows } from "@std/assert";
import {
  assertFiniteNumber,
  assertIntegerIndex,
  assertNonEmptyString,
  assertSafeInteger,
} from "../../src/core/validate.ts";
import { ValidationError } from "../../src/errors.ts";

Deno.test("core: assertNonEmptyString returns trimmed string", () => {
  assertEquals(assertNonEmptyString("  hello  ", "test"), "hello");
  assertEquals(assertNonEmptyString("hello", "test"), "hello");
});

Deno.test("core: assertNonEmptyString rejects empty string", () => {
  assertThrows(
    () => assertNonEmptyString("", "test"),
    ValidationError,
    "cannot be empty",
  );
  assertThrows(
    () => assertNonEmptyString("   ", "test"),
    ValidationError,
    "cannot be empty",
  );
});

Deno.test("core: assertNonEmptyString rejects non-string", () => {
  assertThrows(
    () => assertNonEmptyString(null, "test"),
    ValidationError,
    "cannot be empty",
  );
  assertThrows(
    () => assertNonEmptyString(123, "test"),
    ValidationError,
    "cannot be empty",
  );
});

Deno.test("core: assertSafeInteger accepts safe integers", () => {
  assertSafeInteger(0, "test");
  assertSafeInteger(1, "test");
  assertSafeInteger(-1, "test");
  assertSafeInteger(Number.MAX_SAFE_INTEGER, "test");
  assertSafeInteger(-Number.MAX_SAFE_INTEGER, "test");
});

Deno.test("core: assertSafeInteger rejects unsafe integers", () => {
  assertThrows(
    () => assertSafeInteger(Number.MAX_SAFE_INTEGER + 1, "test"),
    ValidationError,
    "must be a safe integer",
  );
  assertThrows(
    () => assertSafeInteger(Number.MIN_SAFE_INTEGER - 1, "test"),
    ValidationError,
    "must be a safe integer",
  );
});

Deno.test("core: assertSafeInteger rejects non-integers", () => {
  assertThrows(
    () => assertSafeInteger(1.5, "test"),
    ValidationError,
    "must be a safe integer",
  );
  assertThrows(
    () => assertSafeInteger(NaN, "test"),
    ValidationError,
    "must be a safe integer",
  );
  assertThrows(
    () => assertSafeInteger(Infinity, "test"),
    ValidationError,
    "must be a safe integer",
  );
});

Deno.test("core: assertFiniteNumber accepts finite numbers", () => {
  assertFiniteNumber(0, "test");
  assertFiniteNumber(-1, "test");
  assertFiniteNumber(1.5, "test");
  assertFiniteNumber(Number.MAX_VALUE, "test");
});

Deno.test("core: assertFiniteNumber rejects Infinity", () => {
  assertThrows(
    () => assertFiniteNumber(Infinity, "test"),
    ValidationError,
    "must be finite",
  );
  assertThrows(
    () => assertFiniteNumber(-Infinity, "test"),
    ValidationError,
    "must be finite",
  );
});

Deno.test("core: assertFiniteNumber rejects NaN", () => {
  assertThrows(
    () => assertFiniteNumber(NaN, "test"),
    ValidationError,
    "must be finite",
  );
});

Deno.test("core: assertIntegerIndex accepts valid indices", () => {
  assertIntegerIndex(0, "test", 10);
  assertIntegerIndex(5, "test", 10);
  assertIntegerIndex(9, "test", 10);
});

Deno.test("core: assertIntegerIndex rejects negative indices", () => {
  assertThrows(
    () => assertIntegerIndex(-1, "test", 10),
    ValidationError,
    "is out of bounds",
  );
  assertThrows(
    () => assertIntegerIndex(-100, "test", 10),
    ValidationError,
    "is out of bounds",
  );
});

Deno.test("core: assertIntegerIndex rejects index equal to upper bound", () => {
  assertThrows(
    () => assertIntegerIndex(10, "test", 10),
    ValidationError,
    "is out of bounds",
  );
  assertThrows(
    () => assertIntegerIndex(100, "test", 10),
    ValidationError,
    "is out of bounds",
  );
});

Deno.test("core: assertIntegerIndex rejects non-integer indices", () => {
  assertThrows(
    () => assertIntegerIndex(1.5, "test", 10),
    ValidationError,
    "must be an integer",
  );
  assertThrows(
    () => assertIntegerIndex(NaN, "test", 10),
    ValidationError,
    "must be an integer",
  );
});

Deno.test("core: assertIntegerIndex rejects zero upper bound", () => {
  assertThrows(
    () => assertIntegerIndex(0, "test", 0),
    ValidationError,
    "is out of bounds",
  );
});

Deno.test("core: assertIntegerIndex accepts empty collection (upper bound 0)", () => {
  assertThrows(
    () => assertIntegerIndex(-1, "test", 0),
    ValidationError,
    "is out of bounds",
  );
});
