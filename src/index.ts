/**
 * @module
 *
 * Library for easily manage callback-data
 */

import { createHash } from "node:crypto";
import { CompactSerializer } from "./serialization/index.ts";
import type {
	AddFieldInput,
	AddFieldOutput,
	FieldOptions,
	Prettify,
	Schema,
} from "./types.ts";

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
	SchemaTypeInput extends Record<string, any> = Record<never, never>,
> {
	/** `id` for identify the CallbackData */
	id: string;
	private legacyId: string;
	// /** Schema used for serialize/deserialize with {@link CallbackData.pack} and {@link CallbackData.unpack} methods */
	// schema: Record<string, Field> = {};

	protected schema: Schema = {
		optional: [],
		required: [],
	} as Schema;

	/** Pass the `id` with which you can identify the CallbackData */
	constructor(id: string) {
		this.id = createHash("sha1")
			.update(id)
			.digest("base64url")
			.replace(/[_-]/g, "")
			.slice(0, 6);
		// TODO: remove this legacy id
		this.legacyId = createHash("md5").update(id).digest("hex").slice(0, 6);
	}

	/**
	 * Add `string` property to schema
	 * @param key Name of property
	 */
	string<
		Key extends string,
		Optional extends boolean = false,
		const Default extends string = never,
	>(
		key: Key,
		options?: FieldOptions<"string", Optional, never, Default>,
	): CallbackData<
		Prettify<
			SchemaType & AddFieldOutput<"string", Key, Optional, never, Default>
		>,
		Prettify<
			SchemaTypeInput & AddFieldInput<"string", Key, Optional, never, Default>
		>
	> {
		const isOptional = options?.optional ?? options?.default !== undefined;

		this.schema[isOptional ? "optional" : "required"].push({
			key,
			type: "string",
			default: options?.default,
		});

		return this;
	}

	/**
	 * Add `number` property to schema
	 * @param key Name of property
	 */
	number<
		Key extends string,
		Optional extends boolean = false,
		const Default extends number = never,
	>(
		key: Key,
		options?: FieldOptions<"number", Optional, never, Default>,
	): CallbackData<
		Prettify<
			SchemaType & AddFieldOutput<"number", Key, Optional, never, Default>
		>,
		Prettify<
			SchemaTypeInput & AddFieldInput<"number", Key, Optional, never, Default>
		>
	> {
		const isOptional = options?.optional ?? options?.default !== undefined;

		this.schema[isOptional ? "optional" : "required"].push({
			key,
			type: "number",
			default: options?.default,
		});

		return this;
	}

	/**
	 * Add `boolean` property to schema
	 * @param key Name of property
	 */
	boolean<
		Key extends string,
		Optional extends boolean = false,
		const Default extends boolean = false,
	>(
		key: Key,
		options?: FieldOptions<"boolean", Optional, never, Default>,
	): CallbackData<
		Prettify<
			SchemaType & AddFieldOutput<"boolean", Key, Optional, never, Default>
		>,
		Prettify<
			SchemaTypeInput & AddFieldInput<"boolean", Key, Optional, never, Default>
		>
	> {
		const isOptional = options?.optional ?? options?.default !== undefined;

		this.schema[isOptional ? "optional" : "required"].push({
			key,
			type: "boolean",
			default: options?.default,
		});

		return this;
	}

	/**
	 * Add `enum` property to schema
	 * @param key Name of property
	 * @param enumValues Enum values
	 */
	enum<
		Key extends string,
		Optional extends boolean = false,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const T extends any[] = never,
		const Default extends T[number] = never,
	>(
		key: Key,
		enumValues: T,
		options?: FieldOptions<"enum", Optional, T, Default>,
	): CallbackData<
		Prettify<
			SchemaType & AddFieldOutput<"enum", Key, Optional, T[number], Default>
		>,
		Prettify<
			SchemaTypeInput & AddFieldInput<"enum", Key, Optional, T[number], Default>
		>
	> {
		const isOptional = options?.optional ?? options?.default !== undefined;

		this.schema[isOptional ? "optional" : "required"].push({
			key,
			type: "enum",
			enumValues,
			default: options?.default,
		});

		return this;
	}

	/**
	 * Add `uuid` property to schema
	 * @param key Name of property
	 */
	uuid<
		Key extends string,
		Optional extends boolean = false,
		const Default extends string = never,
	>(
		key: Key,
		options?: FieldOptions<"uuid", Optional, never, Default>,
	): CallbackData<
		Prettify<
			SchemaType & AddFieldOutput<"uuid", Key, Optional, never, Default>
		>,
		Prettify<
			SchemaTypeInput & AddFieldInput<"uuid", Key, Optional, never, Default>
		>
	> {
		const isOptional = options?.optional ?? options?.default !== undefined;

		this.schema[isOptional ? "optional" : "required"].push({
			key,
			type: "uuid",
			default: options?.default,
		});

		return this;
	}

	/**
	 * Method that return {@link RegExp} to match this {@link CallbackData}
	 */
	regexp() {
		// return new RegExp(`^${this.id}\\|(.+)$`);
		return new RegExp(`^${this.id}|${this.legacyId}\|(.+)$`);
	}

	/**
	 * Method that return `true` if data is this {@link CallbackData}
	 * @param data String with data
	 */
	filter(data: string) {
		return data.startsWith(this.id) || data.startsWith(`${this.legacyId}|`);
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
	pack<const T extends SchemaTypeInput>(data: T) {
		return `${this.id}${CompactSerializer.serialize(this.schema, data)}`;
	}

	/**
	 * A method for [`deserializing`](https://developer.mozilla.org/en-US/docs/Glossary/Deserialization) data **object** by **schema** from a **string**
	 * @param data String with data (please check that this string matched by {@link CallbackData.regexp})
	 */
	unpack(data: string): SchemaType {
		if (data.startsWith(`${this.legacyId}|`)) {
			const json = JSON.parse(data.replace(`${this.legacyId}|`, ""));
			return json as SchemaType;
		}
		const separatorIndex = data.indexOf(this.id);
		if (separatorIndex === -1)
			throw new Error(
				"You should call unpack only if you use filter(data) method to determine that data is this CallbackData",
			);

		return CompactSerializer.deserialize(
			this.schema,
			data.slice(separatorIndex + this.id.length),
		);
	}
}
