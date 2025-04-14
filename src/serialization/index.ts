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
			if (Object.prototype.hasOwnProperty.call(obj, field.key)) {
				bitmask |= 1 << i;
				optionalParts.push(this.serializeValue(field, obj[field.key]));
			}
		}

		let bitmaskEncoded = "";
		if (schema.optional.length > 0) {
			bitmaskEncoded = bitmask.toString(36);
		}

		return [
			...parts,
			...(schema.optional.length > 0 ? [bitmaskEncoded] : []),
			...optionalParts,
		].join(";");
	}

	static deserialize<const T extends Schema>(
		schema: T,
		str: string,
	): Record<string, unknown> {
		const parts = str.split(";");

		let ptr = 0;
		const result: Record<string, unknown> = {};

		for (const field of schema.required) {
			result[field.key] = this.deserializeValue(field, parts[ptr++]);
		}

		let bitmask = 0;
		if (schema.optional.length > 0) {
			bitmask = Number.parseInt(parts[ptr++], 36);
		}

		for (let i = 0; i < schema.optional.length; i++) {
			const field = schema.optional[i];
			if (bitmask & (1 << i)) {
				result[field.key] = this.deserializeValue(field, parts[ptr++]);
			} else if (field.default !== undefined) {
				result[field.key] = field.default;
			} else {
				console.error("missing", field.key, "at", ptr);
			}
		}

		if (ptr !== parts.length) {
			throw new Error(
				`Invalid serialized data: Expected ${parts.length} parts, processed ${ptr}`,
			);
		}

		return result;
	}

	// TODO: rewrite and cleanup
	private static ESCAPE_MAP: Record<string, string> = {
		";": "\\s", // escape separator
		"\\": "\\\\", // escape escaping symbol
		"=": "\\e", // escape =
	};

	// private static REVERT_ESCAPE_MAP: Record<string, string> = Object.fromEntries(
	// 	Object.entries(CompactSerializer.ESCAPE_MAP).map(([k, v]) => [v, k]),
	// );

	private static UNESCAPE_REGEX = /\\(\\|s|e)/g;

	private static serializeValue(
		field: Schema["required"][0],
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		value: any,
	): string {
		switch (field.type) {
			case "number":
				if (Number.isSafeInteger(value)) {
					return value.toString(36);
				}

				return value.toString();
			case "enum":
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				return field.enumValues!.indexOf(value).toString(36);
			case "uuid": {
				const hex = value.replace(/-/g, "");
				const buffer = Buffer.from(hex, "hex");

				return buffer.toString("base64url");
			}
			case "string": {
				const str = value as string;
				if (str.length === 0) {
					throw new Error(
						`Invalid string value: Empty string at '${field.key}'`,
					);
				}

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
			case "enum": {
				if (!field.enumValues) {
					throw new Error(`Missing enumValues for field '${field.key}'`);
				}
				const index = Number.parseInt(value, 36);
				if (index < 0 || index >= field.enumValues.length) {
					throw new Error(`Invalid index ${index} for enum '${field.key}'`);
				}
				return field.enumValues[index];
			}
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
