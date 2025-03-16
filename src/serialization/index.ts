import type { Schema } from "../types.ts";

export class CompactSerializer {
	static serialize(schema: Schema, obj: any): string {
		const parts: string[] = [];

		for (const field of schema.required) {
			parts.push(this.serializeValue(field, obj[field.key]));
		}

		let bitmask = 0;
		const optionalParts: string[] = [];
		for (let i = 0; i < schema.optional.length; i++) {
			const field = schema.optional[i];
			if (obj.hasOwnProperty(field.key)) {
				bitmask |= 1 << i;
				optionalParts.push(this.serializeValue(field, obj[field.key]));
			}
		}

		const bitmaskBytes = [];
		do {
			bitmaskBytes.unshift(bitmask & 0xff);
			bitmask >>>= 8;
		} while (bitmask > 0);

		const bitmaskEncoded = Buffer.from(bitmaskBytes)
			.toString("base64url")
			.replace(/=/g, "");

		return [bitmaskEncoded, ...parts, ...optionalParts].join(";");
	}

	static deserialize<T extends Record<string, any>>(
		schema: Schema,
		str: string,
	): T {
		const parts = str.split(";");
		let ptr = 0;
		const result: Record<string, any> = {};

		const bitmaskStr = parts[ptr++];
		const bitmaskBytes = Buffer.from(bitmaskStr, "base64url");
		let bitmask = 0;
		for (const byte of bitmaskBytes) {
			bitmask = (bitmask << 8) | byte;
		}

		for (const field of schema.required) {
			result[field.key] = this.deserializeValue(field, parts[ptr++]);
		}

		let optionalIndex = 0;
		for (const field of schema.optional) {
			if (bitmask & (1 << optionalIndex)) {
				result[field.key] = this.deserializeValue(field, parts[ptr++]);
			}
			optionalIndex++;
		}

		return result as T;
	}

	private static serializeValue(
		field: Schema["required"][0],
		value: any,
	): string {
		switch (field.type) {
			case "number":
				return value.toString(36);
			case "enum":
				return field.enumValues!.indexOf(value).toString(36);
			case "string":
				return Buffer.from(value).toString("base64url");
			case "boolean":
				return value ? '1' : '0';
			default:
				throw new Error(`Unsupported type: ${field.type}`);
		}
	}

	private static deserializeValue(field: Schema["required"][0], value: string) {
		switch (field.type) {
			case "number":
				return Number.parseInt(value, 36);
			case "enum":
				return field.enumValues![Number.parseInt(value, 36)];
			case "string":
				return Buffer.from(value, "base64url").toString("utf8");
			case "boolean":
				return value === '1';
			default:
				throw new Error(`Unsupported type: ${field.type}`);
		}
	}
}