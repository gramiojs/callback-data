import { createHash } from "node:crypto";
import type { AddField, Field, Prettify } from "types";

export class CallbackData<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Schema extends Record<string, any> = Record<never, never>,
> {
	id: string;

	schema: Record<string, Field> = {};

	constructor(id: string) {
		this.id = createHash("md5").update(id).digest("hex").slice(0, 6);
	}

	string<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<string, Key>>> {
		this.schema[key] = {
			type: "string",
		};

		return this;
	}

	number<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<number, Key>>> {
		this.schema[key] = {
			type: "number",
		};

		return this;
	}

	boolean<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<boolean, Key>>> {
		this.schema[key] = {
			type: "boolean",
		};

		return this;
	}

	regexp() {
		return new RegExp(`^${this.id}\\|(.+)$`);
	}

	pack(data: Schema) {
		return `${this.id}|${JSON.stringify(data)}`;
	}

	unpack(data: string): Schema {
		const [id, json] = data.split("|");
		if (id !== this.id) throw new Error("WIP. id mismatch");

		return JSON.parse(json);
	}
}
