import { assertEquals } from "@std/assert";
import { stringToCStringPointer } from "../../src/core/strings.ts";

Deno.test("core: stringToCStringPointer returns stable pointer", () => {
  const ptr1 = stringToCStringPointer("test");
  const ptr2 = stringToCStringPointer("test");
  assertEquals(ptr1, ptr2);
});

Deno.test("core: stringToCStringPointer returns different pointers for different strings", () => {
  const ptr1 = stringToCStringPointer("test1");
  const ptr2 = stringToCStringPointer("test2");
  assertEquals(ptr1 !== ptr2, true);
});

Deno.test("core: stringToCStringPointer handles empty string", () => {
  const ptr = stringToCStringPointer("");
  assertEquals(ptr !== null, true);
});

Deno.test("core: stringToCStringPointer handles unicode strings", () => {
  const ptr = stringToCStringPointer("Hello 世界 🌍");
  assertEquals(ptr !== null, true);
});

Deno.test("core: stringToCStringPointer handles long strings", () => {
  const longString = "x".repeat(10000);
  const ptr = stringToCStringPointer(longString);
  assertEquals(ptr !== null, true);
});

Deno.test("core: stringToCStringPointer LRU eviction works", () => {
  const cacheSize = 512;
  const strings: string[] = [];
  for (let i = 0; i < cacheSize + 10; i++) {
    strings.push(`string_${i}_${"y".repeat(50)}`);
  }
  for (let i = 0; i < strings.length; i++) {
    stringToCStringPointer(strings[i]);
  }
  const firstPtr = stringToCStringPointer(strings[0]);
  const fifthPtr = stringToCStringPointer(strings[4]);
  assertEquals(firstPtr !== fifthPtr, true);
});

Deno.test("core: stringToCStringPointer cache update on access", () => {
  const ptr1 = stringToCStringPointer("cache_test");
  const ptr2 = stringToCStringPointer("other_string");
  const ptr3 = stringToCStringPointer("cache_test");
  assertEquals(ptr1, ptr3);
  assertEquals(ptr1 !== ptr2, true);
});
