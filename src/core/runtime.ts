/**
 * Runtime configuration for the library.
 */

/**
 * When true, index bounds are validated on public FFI entry points.
 * Defaults to false for better performance - set to true for additional safety checks.
 */
export let strictValidation = false;

export function setStrictValidation(value: boolean): void {
  strictValidation = value;
}
