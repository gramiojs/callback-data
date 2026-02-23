# @gramio/callback-data

Library for easily manage callback-data.

[![npm](https://img.shields.io/npm/v/@gramio/callback-data?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/callback-data)
[![JSR](https://jsr.io/badges/@gramio/callback-data)](https://jsr.io/@gramio/callback-data)
[![JSR Score](https://jsr.io/badges/@gramio/callback-data/score)](https://jsr.io/@gramio/callback-data)

## Schema migrations

Telegram inline buttons live in chat history — users can click them days or weeks after sending. When your schema changes, old `callback_data` may fail to parse. Use `safeUnpack()` to handle this gracefully instead of crashing.

```typescript
const result = someData.safeUnpack(data);
if (result.success) {
    console.log(result.data);
} else {
    context.answerCallbackQuery("This button is outdated, please use /start");
}
```

### What's safe

**Add optional field at the end** — the only safe structural change. Old data simply won't have the new field; it will be `undefined` or fall back to `default`.

```typescript
// v1
const data = new CallbackData("action").number("id");

// v2 — safe
const data = new CallbackData("action")
    .number("id")
    .string("note", { optional: true });
```

**Rename a field** — field names are not stored in the wire format, only values are. Renaming only affects your TypeScript types.

```typescript
// v1
const data = new CallbackData("action").number("userId");

// v2 — safe, wire format is identical
const data = new CallbackData("action").number("authorId");
```

**Add an enum value at the end** — enum values are stored as their index. Appending new values preserves existing indices.

```typescript
// v1
const data = new CallbackData("action").enum("role", ["user", "admin"]);
//                                                      0       1

// v2 — safe, old indices unchanged
const data = new CallbackData("action").enum("role", ["user", "admin", "moderator"]);
//                                                      0       1         2
```

**Rename an enum value** — same as renaming a field: only the index is stored.

### What's breaking

| Change | Why |
|--------|-----|
| Add required field | Old data has no value for it |
| Remove any field | Shifts positions of all following fields |
| Reorder fields | Positional format — values land in wrong fields |
| Change field type | Same position, different decoding → garbage or error |
| Remove enum value / reorder enum | Shifts indices → wrong value returned |
| Rename `nameId` | Changes the 6-char ID → `filter()` stops matching |

## Usage with [GramIO](https://gramio.dev/)

```typescript
const someData = new CallbackData("example").number("id");

new Bot()
    .command("start", (context) =>
        context.send("some", {
            reply_markup: new InlineKeyboard().text(
                "example",
                someData.pack({
                    id: 1,
                })
            ),
        })
    )
    .callbackQuery(someData, (context) => {
        context.queryData; // is type-safe
    });
```
