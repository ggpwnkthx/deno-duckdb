/**
 * Runtime configuration for the library.
 */

/**
 * When true, index bounds are validated on public FFI entry points.
 * Defaults to false for performance. Set to true during development.
 */
export let strictValidation = false;

export function setStrictValidation(value: boolean): void {
  strictValidation = value;
}
