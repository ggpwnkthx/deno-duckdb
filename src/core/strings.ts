/**
 * Stable C-string encoding helpers.
 *
 * The cache keeps the backing Uint8Array alive for as long as the pointer may be
 * referenced by FFI calls. Implements LRU eviction when cache is full.
 */

import { DatabaseError } from "../errors.ts";

const encoder = new TextEncoder();
const MAX_CACHE_SIZE = 512;

/** Cache entry storing both the encoded bytes and the stable pointer. */
interface CacheEntry {
  /** Encoded bytes including null terminator. */
  bytes: Uint8Array<ArrayBuffer>;
  /** Stable pointer to the bytes. */
  pointer: Deno.PointerObject<unknown>;
}

/** LRU cache for encoded C strings. */
const cache = new Map<string, CacheEntry>();

/**
 * Convert a JavaScript string to a stable C-string pointer.
 *
 * Encodes the string as UTF-8 with a null terminator and returns a stable pointer
 * that remains valid for FFI calls. Results are cached to avoid repeated allocations.
 *
 * @param value - String to encode
 * @returns Stable pointer to null-terminated UTF-8 bytes
 * @throws {DatabaseError} if pointer allocation fails
 */
export function stringToCStringPointer(
  value: string,
): Deno.PointerObject<unknown> {
  const cached = cache.get(value);
  if (cached) {
    cache.delete(value);
    cache.set(value, cached);
    return cached.pointer;
  }

  const bytes: Uint8Array<ArrayBuffer> = encoder.encode(`${value}\0`);
  const pointer = Deno.UnsafePointer.of(bytes) as
    | Deno.PointerObject<unknown>
    | null;

  if (!pointer) {
    throw new DatabaseError("Failed to allocate stable C string pointer", {
      valueLength: value.length,
    });
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(value, { bytes, pointer });
  return pointer;
}
