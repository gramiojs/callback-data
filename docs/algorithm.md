# Алгоритм сериализации callback-data

## Общая идея

Telegram ограничивает `callback_data` до **64 байт**. Стандартный подход — хранить данные как JSON (`id|{"key":"value"}`) — крайне расточителен. Эта библиотека заменяет JSON компактной бинарной схемой, экономя в среднем **2-4x** байт.

## Архитектура

```
CallbackData (builder + pack/unpack)
    │
    ├── Schema { required: Field[], optional: Field[] }
    │
    └── CompactSerializer (stateless serialize/deserialize)
```

### Жизненный цикл

```
Определение схемы        Упаковка               Распаковка
─────────────────    ──────────────────    ──────────────────
new CallbackData()   schema.pack(obj)      schema.unpack(str)
  .number("id")         │                      │
  .string("name")       ▼                      ▼
  .boolean("ok")     "{6-char-id}{serialized}" → CompactSerializer
                                                    .deserialize()
```

## 1. Идентификация: 6-символьный ID

При создании `new CallbackData("myAction")`:

```
nameId ("myAction")
  → SHA-1 hash
  → base64url encode
  → удалить символы `_` и `-`
  → взять первые 6 символов
```

**Результат**: детерминированный, короткий ID (например `UubYq4`), уникальный для каждого `nameId`.

Также генерируется `legacyId` (MD5, hex, 6 символов) для обратной совместимости со старым форматом `legacyId|{json}`.

## 2. Схема: required + optional

Поля разделены на два массива:

- **`required`** — всегда присутствуют в сериализованной строке
- **`optional`** — управляются через bitmask; если поле не передано, оно не занимает места

Поле попадает в `optional`, если указан `{ optional: true }` или задан `default`.

## 3. Формат сериализованной строки

```
{id}{required_1};{required_2};...;{bitmask};{optional_1};{optional_2}
       ▲                           ▲              ▲
       │                           │              │
  всегда есть            base36-число,     только присутствующие
                       какие optional         optional поля
                        поля заданы
```

Разделитель частей — `;` (точка с запятой).

**Bitmask** записывается, только если `schema.optional.length > 0`. Каждый бит соответствует optional-полю: бит `i` = 1 означает, что `optional[i]` присутствует в строке.

### Пример

```typescript
const schema = new CallbackData("full")
  .string("name")        // required
  .number("age")         // required
  .boolean("isAdmin")    // required
  .enum("role", ["user", "moderator", "admin"], { optional: true });

schema.pack({ name: "Alice", age: 30, isAdmin: true, role: "admin" });
// → "UubYq4Alice;u;1;1;2"
//    ^^^^^^ ^^^^^ ^ ^ ^ ^
//    id     name  | | | └─ enum index 2 ("admin") в base36
//                 | | └─── bitmask "1" = optional[0] присутствует
//                 | └───── boolean true → "1"
//                 └─────── 30 в base36 = "u"
```

## 4. Сериализация по типам

### number

| Вход | Метод | Пример |
|------|-------|--------|
| Целое число (`isSafeInteger`) | `value.toString(36)` | `42` → `"16"`, `255` → `"73"` |
| Дробное число | `value.toString()` (as-is) | `0.3` → `"0.3"` |

Base36 для целых чисел даёт значительную экономию: `Number.MAX_SAFE_INTEGER` (16 цифр) → `"2gosa7pa2gv"` (11 символов).

Десериализация: если строка матчит `/^-?[0-9a-z]+$/` → `parseInt(v, 36)`, иначе → `parseFloat(v)`.

### string

Строка записывается as-is, но спецсимволы экранируются:

| Символ | Escape |
|--------|--------|
| `;` | `\s` |
| `\` | `\\` |
| `=` | `\e` |

Десериализация: regex `/(\\|s|e)/g` возвращает оригинальные символы.

**Ограничение**: пустые строки (`""`) запрещены — бросается ошибка.

### boolean

- `true` → `"1"`
- `false` → `"0"`

### enum

Хранится **индекс** значения в массиве `enumValues`, закодированный в base36:

```
["user", "moderator", "admin"]
  0         1            2

"admin" → index 2 → "2"
```

### uuid

UUID сжимается из 36 символов до 22:

```
"b06dacf6-5027-402e-9533-087a4761c4fa"   (36 символов)
  → убрать дефисы → hex string (32 символа)
  → Buffer.from(hex, "hex")              (16 байт)
  → buffer.toString("base64url")         (22 символа)
"sG2s9lAnQC6VMwh6R2HE-g"                 (22 символа)
```

Экономия: **14 байт** на каждый UUID.

### data (nested)

Вложенные `CallbackData` сериализуются рекурсивно, результат кодируется в base64url:

```
inner_object → CompactSerializer.serialize(child.schema, obj)
  → Buffer.from(result, "utf8").toString("base64url")
```

Это изолирует вложенные `;` от основного формата.

## 5. Optional-поля и bitmask

```
schema.optional = [fieldA, fieldB, fieldC]
obj = { fieldA: "x", fieldC: "z" }   // fieldB не передан

bitmask = 0b101 = 5 → "5" (base36)

Сериализованные optional: только fieldA и fieldC (в порядке схемы)
```

При десериализации:
1. Прочитать bitmask
2. Для каждого `optional[i]`: если бит `i` установлен → прочитать следующую часть; иначе → применить `default` (если есть)

**Ограничение**: bitmask использует побитовые операции JS (`1 << i`), работает корректно до **31 optional-поля**.

## 6. Обратная совместимость (legacy)

Старый формат: `{md5_id}|{json}`.

- `filter()` проверяет оба формата: `data.startsWith(this.id) || data.startsWith(legacyId + "|")`
- `unpack()` при обнаружении `legacyId|` делает `JSON.parse` вместо `CompactSerializer.deserialize`

## 7. Таблица экономии байт

| Сценарий | JSON-формат | CompactSerializer | Экономия |
|----------|-------------|-------------------|----------|
| `{id: 42, type: "admin"}` | ~30 байт | 5 байт | **6x** |
| `{id: 42, type: "admin", name: "Alice", status: "active"}` | ~57 байт | 14 байт | **4x** |
| UUID field | 45 байт | 22 байта | **2x** |
| Кириллица `"Анна Каренина"` + meta | ~67 байт | 42 байта | **1.6x** |

---

## Потенциальные улучшения

### Баги / проблемы

1. **`regexp()` — некорректный приоритет `|` в regex**
   ```typescript
   // Текущий код:
   return new RegExp(`^${this.id}|${this.legacyId}\\|(.+)$`);
   // Разбирается как: (^id) | (legacyId\|(.+)$)
   // Первая альтернатива матчит ЛЮБУЮ строку, начинающуюся с id,
   // без привязки к концу строки.
   // Исправление:
   return new RegExp(`^(?:${this.id}|${this.legacyId}\\|)(.+)$`);
   ```

2. **`console.error` в `deserialize`** (`serialization/index.ts:61`) — при отсутствии optional-поля без `default` выводится `console.error` вместо корректной обработки. Стоит либо бросать ошибку, либо тихо пропускать (undefined).

3. **Ошибка `unpack` с misleading message** — при пустых данных и наличии required-полей ошибка говорит `Expected N parts, processed N` (одинаковые числа). Должно быть что-то вроде `Expected data for ${N} required fields, but got empty payload`.

4. **`legacyId` replace в `unpack`** — `data.replace(legacyId + "|", "")` заменяет первое вхождение в любом месте строки. Безопаснее: `data.slice(this.legacyId.length + 1)`.

### Оптимизации

5. **Bitmask > 31 optional-полей** — побитовый сдвиг `1 << i` работает только для i < 32 (JS ограничение 32-bit integer). Для больших схем стоит либо документировать лимит, либо перейти на `BigInt` / multi-byte bitmask.

6. **Избавиться от `Buffer`** — `Buffer.from(hex, "hex")` и `.toString("base64url")` привязывают к Node.js/Bun. Для полной browser/edge совместимости можно заменить на `Uint8Array` + ручной base64url.

7. **Удалить legacy-формат** — в коде есть `TODO: remove this legacy id`. После миграции пользователей стоит убрать legacyId, MD5-зависимость и fallback-логику в `filter`/`unpack`/`regexp`.

### DX (Developer Experience)

8. **Добавить валидацию на этапе `pack`** — сейчас если передать неизвестный ключ или пропустить required-поле, ошибка произойдёт при десериализации или будет silent data corruption. Раннее `pack`-time validation улучшит DX.

9. **Метод `.describe()` или `.toJSON()` для отладки** — чтобы можно было посмотреть текущую схему в читаемом виде:
   ```typescript
   schema.describe()
   // → { id: "UubYq4", required: [{key: "name", type: "string"}, ...], optional: [...] }
   ```

10. **Empty string support** — в тестах есть `.todo` на поддержку пустых строк. Можно кодировать пустую строку как специальный маркер (например `\0` или `\E`).
