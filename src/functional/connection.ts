/**
 * Functional connection lifecycle operations.
 */

import type { ConnectionHandle, DatabaseHandle } from "../types.ts";
import {
  closeConnection as closeConnectionInternal,
  connectToDatabase,
  isValidConnectionHandle,
} from "../core/native.ts";
import { getPointerValue, validateConnectionHandle } from "../core/handles.ts";

export async function create(
  databaseHandle: DatabaseHandle,
): Promise<ConnectionHandle> {
  return await connectToDatabase(databaseHandle);
}

export function closeConnection(handle: ConnectionHandle): void {
  closeConnectionInternal(handle);
}

export function isValidConnection(handle: ConnectionHandle): boolean {
  return isValidConnectionHandle(handle);
}

export function getPointerValueConnection(handle: ConnectionHandle): bigint {
  validateConnectionHandle(handle);
  return getPointerValue(handle);
}
