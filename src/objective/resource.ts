/**
 * Base Resource class for common functionality
 */

import type { DuckDBLibrary } from "../types.ts";
import type { Disposable } from "./disposable.ts";

/**
 * Base class for DuckDB resource handles
 */
export abstract class Resource implements Disposable {
  protected lib: DuckDBLibrary;
  protected closed = false;

  constructor(lib: DuckDBLibrary) {
    this.lib = lib;
  }

  /**
   * Check if the resource is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Throw an error if the resource is closed
   */
  protected checkNotClosed(): void {
    if (this.closed) {
      throw new Error("Resource is closed");
    }
  }

  /**
   * Dispose the resource using Symbol.dispose
   */
  abstract close(): void;

  [Symbol.dispose](): void {
    this.close();
  }
}
