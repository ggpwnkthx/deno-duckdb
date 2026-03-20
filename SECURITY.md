# Security Policy

## Supported Versions

Security fixes are generally provided for the latest published release.

If you believe an older version is affected, please report it anyway and include the
exact version(s) tested.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately. Do **not** open a public issue or
discussion for security-sensitive reports.

### Preferred Reporting Channel

Send your report to: **ibjessup+security@gmail.com**

If this repository provides a private vulnerability reporting mechanism, use that
channel instead.

### What to Include

Please include as much of the following as possible:

- affected package version
- Deno version
- DuckDB / `@ggpwnkthx/libduckdb` version
- operating system and architecture
- a clear description of the issue
- reproduction steps or a minimal proof of concept
- expected impact
- any suggested mitigation or fix, if known

If the issue depends on a particular database file, query, schema, or configuration,
include a minimal example that reproduces the behavior safely.

## Response Process

We aim to:

- acknowledge receipt within **48 hours**
- provide an initial triage update within **7 days**
- keep reporters informed of fix status when possible
- coordinate public disclosure after a fix or mitigation is available

## Scope

This project is a Deno wrapper around the DuckDB native library via FFI.

### In Scope

Please report vulnerabilities involving this wrapper, including for example:

- unsafe FFI boundary handling
- memory-safety issues caused by wrapper behavior
- invalid pointer, buffer, or handle lifecycle management
- insecure temporary-file or configuration handling introduced by this wrapper
- dependency or packaging issues in this wrapper that create a security impact

### Out of Scope

The following are usually not handled as vulnerabilities in this repository:

- vulnerabilities in DuckDB itself\
  Report those to DuckDB's security process.
- vulnerabilities in downstream applications using this library incorrectly
- feature requests or hardening suggestions without a demonstrable security impact
- issues that require non-default unsafe runtime permissions not documented by this project

## Security Notes

This library:

- executes SQL supplied by the caller
- loads native code through Deno FFI
- depends on version-specific ABI/layout assumptions
- may access local files, temporary directories, and other resources depending on how it is configured

Applications using this library are responsible for:

- validating and constraining untrusted SQL inputs
- choosing safe filesystem and temp-directory settings
- granting only the minimum required Deno permissions
- reviewing configuration that enables networked or external DuckDB features

## Version and ABI Compatibility

This project is tightly coupled to specific versions of DuckDB, Deno, and
`@ggpwnkthx/libduckdb`.

Version mismatches may cause undefined behavior, crashes, or incorrect results.
Do not upgrade these components without compatibility testing.

## Disclosure

Please allow time for investigation and remediation before public disclosure.

We follow a coordinated disclosure process and will credit reporters if they would
like to be acknowledged.
