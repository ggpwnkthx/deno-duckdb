# Contributing to @ggpwnkthx/duckdb

Thank you for your interest in contributing!

## Prerequisites

- **Deno 2.0+** - This library requires Deno's FFI support
- **@ggpwnkthx/libduckdb@1.0.15** - Pinned in `deno.json`

## Development Setup

1. Clone the repository
2. Install dependencies (Deno fetches JSR packages automatically):
   ```bash
   deno cache ./src/mod.ts
   ```

## Development Commands

```bash
# Run all checks (format, lint, type check, test)
deno task ci

# Run tests only
deno task test

# Run a specific test file
deno test -A ./tests/functional_api.test.ts

# Type check the project
deno check

# Lint the project
deno lint

# Format the project
deno fmt

# Run benchmarks
deno task bench

# Run all examples
deno task examples
```

## Code Style

This project uses Deno's formatter with the following settings (defined in `deno.json`):

- Line width: 88
- Indent width: 2 spaces
- Semicolons: yes
- Single quotes: no
- Trailing commas: only multi-line

Run `deno fmt` before committing.

## Testing

All tests are in the `tests/` directory. Tests use `@std/assert` for assertions.

### Writing Tests

```ts
Deno.test({
  name: "description of the test",
  async fn() {
    // test code
  },
});
```

### Test Categories

- `tests/api/` - API tests for functional and objective interfaces
- `tests/core/` - Core layer tests (config, handles, library)
- `tests/errors.test.ts` - Error handling tests

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Ensure `deno task ci` passes
4. Update documentation if needed
5. Submit a pull request with the completed checklist in the PR template

## Version Compatibility

This library is tightly coupled to specific versions:

| Dependency           | Version |
| -------------------- | ------- |
| DuckDB               | 1.5.0   |
| Deno                 | 2.0+    |
| @ggpwnkthx/libduckdb | 1.0.15  |

Changes to these versions may require significant testing due to direct memory access assumptions in result decoding.

## Questions?

Open an issue for bugs or feature requests. For general questions,Discussions is the best place to ask.
