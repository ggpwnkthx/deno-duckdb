/**
 * Runtime configuration for the library.
 */

/**
 * When true, index bounds are validated on public FFI entry points.
 */
export let strictValidation = true;

export function setStrictValidation(value: boolean): void {
  strictValidation = value;
}
