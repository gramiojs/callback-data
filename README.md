# @gramio/callback-data

Library for easily manage callback-data.

[![npm](https://img.shields.io/npm/v/@gramio/callback-data?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/callback-data)
[![JSR](https://jsr.io/badges/@gramio/callback-data)](https://jsr.io/@gramio/callback-data)
[![JSR Score](https://jsr.io/badges/@gramio/callback-data/score)](https://jsr.io/@gramio/callback-data)

WIP. JSON.stringify is temporarily used under the hood.

## Usage with [GramIO](https://gramio.netlify.app/)

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

Use is not recommended at this stage!
