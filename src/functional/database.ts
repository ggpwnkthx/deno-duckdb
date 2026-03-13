/**
 * Functional database lifecycle operations.
 */

import type { DatabaseConfig, DatabaseHandle } from "../types.ts";
import {
  closeDatabase as closeDatabaseInternal,
  isValidDatabaseHandle,
  openDatabase,
} from "../core/native.ts";
import {
  getPointerValue as getHandlePointerValue,
  validateDatabaseHandle,
} from "../core/handles.ts";

export async function open(config?: DatabaseConfig): Promise<DatabaseHandle> {
  return await openDatabase(config);
}

export function closeDatabase(handle: DatabaseHandle): void {
  closeDatabaseInternal(handle);
}

export function isValidDatabase(handle: DatabaseHandle): boolean {
  return isValidDatabaseHandle(handle);
}

export function getPointerValueDatabase(handle: DatabaseHandle): bigint {
  validateDatabaseHandle(handle);
  return getHandlePointerValue(handle);
}

/** Backward-compatible alias. */
export const getPointerValue = getPointerValueDatabase;
