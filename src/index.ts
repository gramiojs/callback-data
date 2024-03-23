import type { AddField, Prettify } from "types";

export class CallbackData<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Schema extends Record<string, any> = Record<never, never>,
> {
	id: string;

	schema = {};

	constructor(id: string) {
		this.id = id;
	}

	string<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<string, Key>>> {
		return this;
	}

	number<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<number, Key>>> {
		return this;
	}

	boolean<Key extends string>(
		key: Key,
	): CallbackData<Prettify<Schema & AddField<boolean, Key>>> {
		return this;
	}

	pack(data: Schema) {
		return "";
	}

	unpack(data: string) {
		return {} as Schema;
	}
}
