# @gramio/callback-data

Compact serialization library for Telegram `callback_data` (64-byte limit).

## Architecture

- `src/index.ts` — `CallbackData` class: builder-pattern schema definition, `pack()`/`unpack()` entry points
- `src/serialization/index.ts` — `CompactSerializer`: stateless serialize/deserialize engine
- `src/types.ts` — TypeScript type-level machinery (generic inference, schema types)

## Key docs

- **[docs/algorithm.md](docs/algorithm.md)** — detailed description of the serialization algorithm, wire format, type encodings, and a list of known issues / potential improvements

## Commands

- `bun test` — run tests
- `bunx pkgroll` — build for publish
