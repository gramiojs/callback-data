import { describe, expect, test } from "bun:test";
import { CompactSerializer } from "../src/serialization/index.ts";
import type { Schema } from "../src/types.ts";
import { generateMixedUUIDs, getBytesLength } from "./utils.ts";

describe("CompactSerializer", () => {
	const testSchema: Schema = {
		required: [
			{ key: "id", type: "number" },
			{ key: "type", type: "enum", enumValues: ["user", "admin"] },
		],
		optional: [
			{ key: "name", type: "string" },
			{ key: "status", type: "enum", enumValues: ["active", "inactive"] },
		],
	};

	test("basic serialization/deserialization", () => {
		const obj = {
			id: 42,
			type: "admin",
			name: "Alice",
			status: "active",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		expect(serialized).toMatchInlineSnapshot(`"16;1;3;Alice;0"`);

		const deserialized = CompactSerializer.deserialize(testSchema, serialized);

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`14`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`57`);

		expect(deserialized).toEqual(obj);
	});

	test("missing optional fields", () => {
		const obj = {
			id: 42,
			type: "user",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		const deserialized = CompactSerializer.deserialize(testSchema, serialized);

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`6`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`23`);

		expect(deserialized).toEqual({
			id: 42,
			type: "user",
		});
	});

	test("string escaping", () => {
		const obj = {
			id: 42,
			type: "user",
			name: "Contains;semicolon",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		const deserialized = CompactSerializer.deserialize(testSchema, serialized);

		expect(serialized).toMatchInlineSnapshot(`"16;0;1;Contains\\ssemicolon"`);

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`26`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`51`);

		expect(deserialized.name).toBe("Contains;semicolon");
	});

	test("number boundaries", () => {
		const obj = {
			id: Number.MAX_SAFE_INTEGER,
			type: "admin",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		const deserialized = CompactSerializer.deserialize(testSchema, serialized);

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`15`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`38`);

		expect(deserialized.id).toBe(Number.MAX_SAFE_INTEGER);
	});
	test("number 1", () => {
		const obj = {
			id: 1,
			type: "admin",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		const deserialized = CompactSerializer.deserialize(testSchema, serialized);

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`5`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`23`);

		expect(deserialized.id).toBe(1);
	});

	test("handles cyrillic characters", () => {
		const obj = {
			id: 42,
			type: "user",
			name: "Анна Каренина;Тест",
		};

		const serialized = CompactSerializer.serialize(testSchema, obj);
		console.log(serialized, getBytesLength(serialized));

		const deserialized = CompactSerializer.deserialize(testSchema, serialized);
		console.log(deserialized, getBytesLength(deserialized));

		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`42`);
		expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`67`);

		expect(deserialized.name).toBe("Анна Каренина;Тест");

		expect(getBytesLength(serialized)).toBeLessThan(getBytesLength(obj));
	});

	test("boolean serialization", () => {
		const schema = {
			required: [{ key: "flag" as const, type: "boolean" as const }],
			optional: [],
		};

		const serialized = CompactSerializer.serialize(schema, { flag: true });
		expect(serialized).toMatchInlineSnapshot(`"1"`);

		const deserialized = CompactSerializer.deserialize(schema, serialized);
		expect(deserialized.flag).toBe(true);
	});

	test("string field serialization", () => {
		const schema = {
			required: [{ key: "text" as const, type: "string" as const }],
			optional: [],
		};

		const testData = { text: "TestString" };
		const serialized = CompactSerializer.serialize(schema, testData);
		const deserialized = CompactSerializer.deserialize(schema, serialized);

		expect(deserialized.text).toBe("TestString");
		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`10`);
	});

	test.todo("should handle empty strings", () => {
		const schema = {
			required: [{ key: "empty" as const, type: "string" as const }],
			optional: [],
		};

		const testData = { empty: "" };
		const serialized = CompactSerializer.serialize(schema, testData);
		const deserialized = CompactSerializer.deserialize(schema, serialized);

		expect(deserialized.empty).toBe("");
	});

	test.todo("should throw error on empty strings", () => {
		const schema = {
			required: [{ key: "empty" as const, type: "string" as const }],
			optional: [],
		};

		const testData = { empty: "" };
		expect(() => CompactSerializer.serialize(schema, testData)).toThrow();
	});

	test("float precision", () => {
		const schema = {
			required: [{ key: "value" as const, type: "number" as const }],
			optional: [],
		};

		const testValue = 0.1 + 0.2; // 0.30000000000000004
		const serialized = CompactSerializer.serialize(schema, {
			value: testValue,
		});
		const deserialized = CompactSerializer.deserialize(schema, serialized);

		expect(deserialized.value).not.toBe(0.3);
		expect(deserialized.value).toBeCloseTo(0.3, 15);
	});

	test("handles UUID v4 and v7", () => {
		const schema = {
			required: [{ key: "id" as const, type: "uuid" as const }],
			optional: [],
		};

		const firstUUIDData = { id: "b06dacf6-5027-402e-9533-087a4761c4fa" };
		const serialized = CompactSerializer.serialize(schema, firstUUIDData);
		const deserialized = CompactSerializer.deserialize(schema, serialized);

		expect(serialized).toMatchInlineSnapshot(`"sG2s9lAnQC6VMwh6R2HE-g"`);
		expect(getBytesLength(serialized)).toMatchInlineSnapshot(`22`);
		expect(getBytesLength(firstUUIDData)).toMatchInlineSnapshot("45");
		expect(deserialized.id).toBe(firstUUIDData.id);

		const testUUIDs = generateMixedUUIDs(50);

		for (const uuid of testUUIDs) {
			const serialized = CompactSerializer.serialize(schema, { id: uuid });
			const deserialized = CompactSerializer.deserialize(schema, serialized);

			expect(getBytesLength(serialized)).toBe(22);
			expect(deserialized.id).toBe(uuid);
		}
	});

	test("applies defaults during deserialization", () => {
		const schema = {
			required: [{ key: "id", type: "number" as const }],
			optional: [
				{
					key: "theme",
					type: "string" as const,
					default: "dark",
				},
				{
					key: "retryCount",
					type: "number" as const,
					default: 3,
				},
			],
		};

		const serialized = CompactSerializer.serialize(schema, { id: 42 });

		const deserialized = CompactSerializer.deserialize(schema, serialized);

		expect(deserialized).toEqual({
			id: 42,
			theme: "dark",
			retryCount: 3,
		});
	});

	test("does not store defaults in serialized data", () => {
		const schema = {
			required: [],
			optional: [
				{
					key: "lang",
					type: "string" as const,
					default: "en",
				},
			],
		};

		const serialized = CompactSerializer.serialize(schema, {});

		expect(serialized).toBe("0");
	});
});
