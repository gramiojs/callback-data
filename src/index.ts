/**
 * @module
 *
 * Library for easily manage callback-data
 */

import { createHash } from "node:crypto";
import type { AddField, Field, Prettify } from "types";

/**
 * Class-helper that construct schema and serialize/deserialize with {@link CallbackData.pack} and {@link CallbackData.unpack} methods
 *
 * @example
 * ```typescript
 * const someData = new CallbackData("example").number("id");
 *
 * new Bot()
 *     .command("start", (context) =>
 *         context.send("some", {
 *             reply_markup: new InlineKeyboard().text(
 *                 "example",
 *                 someData.pack({
 *                     id: 1,
 *                 })
 *             ),
 *         })
 *     )
 *     .callbackQuery(someData, (context) => {
 *         context.queryData; // is type-safe
 *     });
 * ```
 */
export class CallbackData<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Schema extends Record<string, any> = Record<never, never>,
> {
	/** `id` for identify the CallbackData */
	id: string;
	/** Schema used for serialize/deserialize with {@link CallbackData.pack} and {@link CallbackData.unpack} methods */
	schema: Record<string, Field> = {};

	/** Pass the `id` with which you can identify the CallbackData */
	constructor(id: string) {
		this.id = createHash("md5").update(id).digest("hex").slice(0, 6);
	}

	/**
	 * Add `string` property to schema
	 * @param key Name of property
	 */
	string<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<string, Key>>> {
		this.schema[key] = {
			type: "string",
		};

		return this;
	}

	/**
	 * Add `number` property to schema
	 * @param key Name of property
	 */
	number<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<number, Key>>> {
		this.schema[key] = {
			type: "number",
		};

		return this;
	}

	/**
	 * Add `boolean` property to schema
	 * @param key Name of property
	 */
	boolean<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<boolean, Key>>> {
		this.schema[key] = {
			type: "boolean",
		};

		return this;
	}

	/**
	 * Method that return {@link RegExp} to match this {@link CallbackData}
	 */
	regexp() {
		return new RegExp(`^${this.id}\\|(.+)$`);
	}

	/**
	 * A method for [`serializing`](https://developer.mozilla.org/en-US/docs/Glossary/Serialization) **object data** defined by **schema** into a **string**
	 * @param data Object defined by schema
	 *
	 * @example
	 * ```ts
	 * const someData = new CallbackData("example").number("id");
	 *
	 * context.send("some", {
	 * 	reply_markup: new InlineKeyboard().text(
	 * 		"example",
	 * 		someData.pack({
	 * 			id: 1,
	 * 		}),
	 * 	),
	 * });
	 * ```
	 */
	pack(data: Schema) {
		return `${this.id}|${JSON.stringify(data)}`;
	}

	/**
	 * A method for [`deserializing`](https://developer.mozilla.org/en-US/docs/Glossary/Deserialization) data **object** by **schema** from a **string**
	 * @param data String with data (please check that this string matched by {@link CallbackData.regexp})
	 */
	unpack(data: string): Schema {
		const [id, json] = data.split("|");
		if (id !== this.id) throw new Error("WIP. id mismatch");

		return JSON.parse(json);
	}
}
