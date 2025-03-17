import type { Schema } from "../types.ts";

export class CompactSerializer {
	static serialize<const T extends Schema>(
		schema: T,
		obj: Record<string, unknown>,
	): string {
		const parts: string[] = [];

		for (const field of schema.required) {
			parts.push(this.serializeValue(field, obj[field.key]));
		}

		let bitmask = 0;
		const optionalParts: string[] = [];
		for (let i = 0; i < schema.optional.length; i++) {
			const field = schema.optional[i];
			// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
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

	static deserialize<const T extends Schema>(schema: T, str: string): any {
		const parts = str.split(";");
		let ptr = 0;
		const result: Record<string, unknown> = {};

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
			} else if (field.default !== undefined) {
				result[field.key] = field.default;
			}
			optionalIndex++;
		}

		return result as T;
	}

	// TODO: rewrite and cleanup
	private static ESCAPE_MAP: Record<string, string> = {
		";": "\\s", // escape separator
		"\\": "\\\\", // escape escaping symbol
	};

	// private static REVERT_ESCAPE_MAP: Record<string, string> = Object.fromEntries(
	// 	Object.entries(CompactSerializer.ESCAPE_MAP).map(([k, v]) => [v, k]),
	// );

	private static UNESCAPE_REGEX = /\\(\\|s|e)/g;

	private static serializeValue(
		field: Schema["required"][0],
		value: any,
	): string {
		switch (field.type) {
			case "number":
				if (Number.isSafeInteger(value)) {
					return value.toString(36);
				}

				return value.toString();
			case "enum":
				return field.enumValues!.indexOf(value).toString(36);
			case "uuid": {
				const hex = value.replace(/-/g, "");
				const buffer = Buffer.from(hex, "hex");

				return buffer.toString("base64url");
			}
			case "string": {
				const str = value as string;

				if (!/[;\\=]/.test(str)) return str;

				return str.replace(/[;\\=]/g, (m) => this.ESCAPE_MAP[m]);
			}
			case "boolean":
				return value ? "1" : "0";
			default:
				throw new Error(`Unsupported type: ${field.type}`);
		}
	}

	private static deserializeValue(field: Schema["required"][0], value: string) {
		switch (field.type) {
			case "number":
				if (/^-?[0-9a-z]+$/.test(value)) {
					return Number.parseInt(value, 36);
				}

				return Number.parseFloat(value);
			case "enum":
				return field.enumValues![Number.parseInt(value, 36)];
			case "uuid": {
				const buffer = Buffer.from(value, "base64url");
				const hex = buffer.toString("hex");

				return [
					hex.slice(0, 8),
					hex.slice(8, 12),
					hex.slice(12, 16),
					hex.slice(16, 20),
					hex.slice(20, 32),
				]
					.join("-")
					.toLowerCase();
			}
			case "string": {
				return value.replace(this.UNESCAPE_REGEX, (_, code) =>
					code === "s" ? ";" : code === "e" ? "=" : "\\",
				);
			}
			case "boolean":
				return value === "1";
			default:
				throw new Error(`Unsupported type: ${field.type}`);
		}
	}
}
