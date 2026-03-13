/**
 * Stable C-string encoding helpers.
 *
 * The cache keeps the backing Uint8Array alive for as long as the pointer may be
 * referenced by FFI calls.
 */

import { DatabaseError } from "../errors.ts";

const encoder = new TextEncoder();
const MAX_CACHE_SIZE = 512;

interface CacheEntry {
  bytes: Uint8Array<ArrayBuffer>;
  pointer: Deno.PointerObject<unknown>;
}

const cache = new Map<string, CacheEntry>();

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

export function clearStringCache(): void {
  cache.clear();
}
