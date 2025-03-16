/**
 * @module
 *
 * Library for easily manage callback-data
 */

import { createHash } from "node:crypto";
import type { AddField, Field, Prettify, FieldOptions, Schema } from "./types.ts";
import { CompactSerializer } from "./serialization/index.ts";

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
	SchemaType extends Record<string, any> = Record<never, never>,
> {
	/** `id` for identify the CallbackData */
	id: string;
	// /** Schema used for serialize/deserialize with {@link CallbackData.pack} and {@link CallbackData.unpack} methods */
	// schema: Record<string, Field> = {};
	 
	protected schema: Schema = {
		optional: [],
		required: [],
	} as Schema;

	/** Pass the `id` with which you can identify the CallbackData */
	constructor(id: string) {
		this.id = createHash("md5").update(id).digest("hex").slice(0, 6);
	}

	/**
	 * Add `string` property to schema
	 * @param key Name of property
	 */
	string<Key extends string, Optional extends boolean = false>(
		key: Key,
		options?: FieldOptions<"string", Optional>,
	): CallbackData<Prettify<SchemaType & AddField<"string", Key, Optional>>> {
		this.schema[options?.optional ? "optional" : "required"].push({
			key,
			type: "string",
			// default: options?.default,
		});

		return this;
	}

	/**
	 * Add `number` property to schema
	 * @param key Name of property
	 */
	number<Key extends string, Optional extends boolean = false>(
		key: Key,
		options?: FieldOptions<"number", Optional>,
	): CallbackData<Prettify<SchemaType & AddField<"number", Key, Optional>>> {
		this.schema[options?.optional ? "optional" : "required"].push({
			key,
			type: "number",
			// default: options?.default,
		});

		return this;
	}

	/**
	 * Add `boolean` property to schema
	 * @param key Name of property
	 */
	boolean<Key extends string, Optional extends boolean = false>(
		key: Key,
		options?: FieldOptions<"boolean", Optional>,
	): CallbackData<Prettify<SchemaType & AddField<"boolean", Key, Optional>>> {
		this.schema[options?.optional ? "optional" : "required"].push({
			key,
			type: "boolean",
				// default: options?.default,
		});

		return this;
	}

	enum<Key extends string, Optional extends boolean = false, const T extends any[] = never>(
		key: Key,
		enumValues:  T,
		options?: FieldOptions<"enum", Optional, T>,
	): CallbackData<Prettify<SchemaType & AddField<"enum", Key, Optional, T[number]>>> {
		this.schema[options?.optional ? "optional" : "required"].push({
			key,
			type: "enum",
			enumValues,
		});

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
	pack(data: SchemaType) {
		return `${this.id};${CompactSerializer.serialize(this.schema, data)}`;
	}

	/**
	 * A method for [`deserializing`](https://developer.mozilla.org/en-US/docs/Glossary/Deserialization) data **object** by **schema** from a **string**
	 * @param data String with data (please check that this string matched by {@link CallbackData.regexp})
	 */
	unpack(data: string): SchemaType {
		const [id, json] = data.split(";");
		if (id !== this.id) throw new Error("WIP. id mismatch");

		return CompactSerializer.deserialize(this.schema, json);
	}
}
