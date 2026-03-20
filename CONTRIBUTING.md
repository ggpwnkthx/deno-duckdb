# Contributing to @ggpwnkthx/duckdb

Thanks for your interest in contributing.

This project is a Deno wrapper around DuckDB's native library via FFI. Because it
uses direct memory access and version-specific ABI/layout assumptions, correctness and
compatibility matter a lot. Small changes can have outsized effects.

## Before You Start

Please read the README first, especially the version compatibility notes.

This project is tightly coupled to specific versions:

| Dependency           | Version |
| -------------------- | ------- |
| DuckDB               | 1.5.0   |
| Deno                 | 2.0+    |
| @ggpwnkthx/libduckdb | 1.0.15  |

Do not update DuckDB, Deno, or `@ggpwnkthx/libduckdb` casually. Version changes may
require substantial compatibility testing.

## Development Setup

1. Fork and clone the repository
2. Ensure you are using a compatible Deno version
3. Cache dependencies:

```bash
deno cache ./src/mod.ts
```

## Permissions

Typical development and test workflows may require:

- `--allow-ffi`
- `--allow-read`
- `--allow-env`

If the native DuckDB library is not already present and must be fetched, you may also
need:

- `--allow-net`
- `--allow-write`

Most repository tasks already pass the necessary flags where applicable.

## Development Commands

```bash
# Run all checks used in CI
deno task ci

# Run tests
deno task test

# Run a specific test file
deno test -A ./tests/api/api.test.ts

# Type-check the public entrypoint
deno check ./src/mod.ts

# Lint
deno lint

# Format
deno fmt

# Run benchmarks
deno task bench

# Run examples
deno task examples
```

## Project Structure

- `src/core/` - internal shared helpers, config, validation, handles, library loading
- `src/functional/` - functional API
- `src/objective/` - object-oriented API
- `tests/` - test suite

## Contribution Guidelines

### Bug Fixes

- Add or update tests that fail before the fix and pass after it
- Prefer the smallest change that fixes the issue cleanly
- Preserve existing public API behavior unless a breaking change is intentional

### New Features

- Open an issue or discussion first for substantial changes
- Include tests
- Update README and examples when the public API changes
- Keep dependencies minimal

### FFI and Result-Decoding Changes

Changes touching FFI boundaries, pointer handling, memory layout assumptions, result
decoding, or ABI-sensitive code need extra care.

For these changes:

- explain the ABI/layout assumption clearly in the PR
- add focused tests for the affected types/paths
- call out risks around memory safety, invalid handles, or version coupling

## Code Style

This project uses Deno's formatter and linter. The canonical settings are defined in
`deno.json`.

Please run:

```bash
deno fmt
deno lint
```

before opening a PR.

A few expectations:

- keep TypeScript strict
- avoid `any`
- prefer small, composable functions
- validate untrusted inputs early
- preserve typed errors and clear failure modes
- avoid unnecessary dependencies

## Testing

Tests live under `tests/` and use `@std/assert`.

Examples of current test areas include:

- `tests/api/` - public API behavior and parity
- `tests/core/` - config, handles, library loading, validation
- `tests/errors.test.ts` - error hierarchy and error behavior
- `tests/functional/` - functional helpers and value extraction

When adding tests:

- use descriptive names
- keep fixtures minimal
- close resources explicitly unless the test is specifically about lifecycle behavior
- add regression coverage for reported bugs

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Add or update tests
4. Update docs if behavior changed
5. Run `deno task ci`
6. Open a pull request with a clear description of:
   - what changed
   - why it changed
   - any compatibility or safety considerations

## AI / LLM-Assisted Contributions

AI/LLM-generated code is allowed, but contributors are fully responsible for anything they submit.

If you use AI tools:

- review, understand, and test all generated code before opening a PR
- ensure the code matches this project's style, safety, and version requirements
- do not submit code you cannot explain or maintain
- verify that generated code does not add unsafe dependencies, weaken validation, or change public behavior unintentionally
- avoid including secrets, private data, or unpublished code in AI tool prompts

PRs may be rejected if AI-generated changes are low-quality, unreviewed, overly broad, or unsafe.

## Reporting Security Issues

Please do **not** open public issues for security-sensitive bugs.

See `SECURITY.md` for vulnerability reporting instructions.

## Questions

Open an issue for bugs or feature requests.

For general questions, GitHub Discussions is the best place to ask.
