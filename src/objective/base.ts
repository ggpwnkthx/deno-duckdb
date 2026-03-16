/**
 * Shared OO resource base class.
 */

import { InvalidResourceError } from "../errors.ts";

/**
 * Abstract base class for DuckDB resources that require lifecycle management.
 *
 * Provides common functionality for handle management, disposal tracking,
 * and implements the `Symbol.dispose` protocol for automatic resource cleanup.
 *
 * Subclasses must implement resource-specific destruction logic.
 */
export abstract class DisposableResource<THandle extends Uint8Array> {
  protected handle: THandle | null;

  protected constructor(handle: THandle) {
    this.handle = handle;
  }

  protected requireHandle(label: string): THandle {
    if (!this.handle) {
      throw new InvalidResourceError(`${label} is closed`);
    }

    return this.handle;
  }

  protected releaseHandle(): THandle | null {
    const current = this.handle;
    this.handle = null;
    return current;
  }

  isClosed(): boolean {
    return this.handle === null;
  }

  abstract close(): void;

  [Symbol.dispose](): void {
    this.close();
  }
}
