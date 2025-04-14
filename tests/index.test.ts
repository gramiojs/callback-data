import { describe, expect, test } from "bun:test";
import { CallbackData } from "../src/index.ts";
import { getBytesLength } from "./utils.ts";

describe("CallbackData", () => {
	test("should create instance with hashed id", () => {
		const builder = new CallbackData("test");
		expect(builder.id).toMatch(/^[a-zA-Z0-9]{6}$/);
	});

	test("should build schema with required fields", () => {
		const schema = new CallbackData("test")
			.string("name")
			.number("age")
			.boolean("isActive")
			.enum("role", ["admin", "user"]);

		expect(schema).toBeInstanceOf(CallbackData);
	});

	test("should handle optional fields with defaults", () => {
		const schema = new CallbackData("test")
			.string("optionalString", { optional: true }) // default: 'default'
			.number("optionalNumber", { optional: true })
			.boolean("optionalBoolean", { optional: true });

		expect(schema).toBeInstanceOf(CallbackData);
	});

	test("should handle empty object", () => {
		const schema = new CallbackData("test");
		const packed = schema.pack();
		const unpacked = schema.unpack(packed);

		expect(unpacked).toEqual({});
	});

	test("pack/unpack should serialize/deserialize correctly", () => {
		const testData = { id: 42, name: "Test" };
		const schema = new CallbackData("test").number("id").string("name");

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(packed.startsWith(schema.id)).toBeTrue();
		expect(unpacked).toEqual({
			id: 42,
			name: "Test",
		});
	});

	test("regexp should match packed format", () => {
		const testData = { value: 1 };
		const schema = new CallbackData("test").number("value");
		const packed = schema.pack(testData);

		expect(schema.regexp().test(packed)).toBeTrue();
	});

	test("unpack should throw on invalid id", () => {
		const schema = new CallbackData("test");
		const invalidData = 'wrong|{"value":1}';

		expect(() => schema.unpack(invalidData)).toThrow(
			`You should call unpack only if you use filter(data) method to determine that data is this CallbackData. Currently, unpack is called for 'test' with data '${invalidData}'`,
		);
	});

	test("regexp should return true ONLY for valid data", () => {
		const schema = new CallbackData("test");
		const validData = schema.pack({ value: 1 });
		const invalidData = 'wrong|{"value":1}';

		expect(schema.regexp().test(validData)).toBeTrue();
		expect(schema.regexp().test(invalidData)).toBeFalse();
	});

	test("should generate unique IDs for similar names", () => {
		const INSTANCE_COUNT = 50;
		const baseName = "test-";

		const instances = Array.from(
			{ length: INSTANCE_COUNT },
			(_, i) => new CallbackData(`${baseName}${i.toString().padStart(3, "0")}`),
		);

		const ids = instances.map((instance) => instance.id);
		const uniqueIds = new Set(ids);

		expect(uniqueIds.size).toBe(INSTANCE_COUNT);
		expect(ids.every((id) => id.length === 6)).toBeTrue();
		expect(ids.every((id) => /^[A-Za-z0-9]+$/.test(id))).toBeTrue();
	});

	test("unique id across restarts", () => {
		const INSTANCE_COUNT = 50;

		const instances = Array.from(
			{ length: INSTANCE_COUNT },
			(_, i) => new CallbackData(`${i}`),
		);

		const ids = instances.map((instance) => instance.id);
		const uniqueIds = new Set(ids);

		expect(uniqueIds.size).toBe(INSTANCE_COUNT);
		expect(ids).toMatchInlineSnapshot(`
      [
        "tlifxq",
        "NWoZK3",
        "2kuSN7",
        "d95o2u",
        "G2RTiS",
        "rDR41p",
        "wdZbuq",
        "kCujza",
        "l27zqX",
        "Ct58LP",
        "sdV4ER",
        "F7oHkU",
        "e1IAm2",
        "vTB6Ps",
        "jXhkhI",
        "8avWcD",
        "FXS923",
        "BxbZcI",
        "nmpVtr",
        "sDH9rt",
        "kQMq17",
        "RysHuf",
        "Esb8Bs",
        "1DWmzd",
        "TRNLwH",
        "9uESbO",
        "iHMJ0E",
        "vDPqTi",
        "ClfLU7",
        "dxmhx4",
        "ItIAGc",
        "YyZnVH",
        "y05SCL",
        "tmkupd",
        "8fg2y0",
        "lypnxI",
        "AdNUBM",
        "y3odd1",
        "WzhM4y",
        "yjUS9N",
        "rz4TNC",
        "dh8iss",
        "ksOs51",
        "AobdVS",
        "mPvEL6",
        "2RDUVY",
        "i70laE",
        "gnv8RY",
        "ZOCVnY",
        "LgHhdG",
      ]
    `);
	});
});

describe("Serialization/Deserialization", () => {
	test("should handle all field types", () => {
		const schema = new CallbackData("full")
			.string("name")
			.number("age")
			.boolean("isAdmin")
			.enum("role", ["user", "moderator", "admin"], { optional: true });

		const testData = {
			name: "Alice",
			age: 30,
			isAdmin: true,
			role: "admin" as const,
		};

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		console.log(testData, packed, unpacked);

		expect(unpacked).toEqual(testData);
		expect(packed.startsWith(schema.id)).toBeTrue();
		expect(packed).toMatchInlineSnapshot(`"UubYq4Alice;u;1;1;2"`);
		expect(schema.filter(packed)).toBeTrue();
	});

	test("should handle special characters in strings", () => {
		const schema = new CallbackData("special").string("text");
		const testData = { text: "Hello|World\\nTest;Escaped" };

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(unpacked?.text).toBe(testData.text);
	});

	test("should handle number boundaries", () => {
		const schema = new CallbackData("numbers").number("max");
		const testData = { max: Number.MAX_SAFE_INTEGER };

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(unpacked?.max).toBe(testData.max);
	});

	test("should handle minus numbers", () => {
		const schema = new CallbackData("numbers").number("min");
		const testData = { min: Number.MIN_SAFE_INTEGER };

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(unpacked?.min).toBe(testData.min);
	});

	test("should handle float numbers", () => {
		const schema = new CallbackData("numbers").number("float");
		const testData = { float: 0.1 + 0.2 };

		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(packed).toMatchInlineSnapshot(`"E4wvhC0.30000000000000004"`); // We can improve compact and make 0.30000000000000004 -> P_OuFHrhR64
		// But there many cons like 1.23 (4 symbols) ->  fP51wpA (7 symbols)
		// So we wants to keep floats as is
		expect(getBytesLength(packed)).toMatchInlineSnapshot(`25`);
		expect(unpacked?.float).toBe(testData.float);
	});

	test("should handle boolean values", () => {
		const schema = new CallbackData("bools").boolean("flag1").boolean("flag2");

		const testData = { flag1: true, flag2: false };
		const unpacked = schema.unpack(schema.pack(testData));

		expect(unpacked?.flag1).toBe(true);
		expect(unpacked?.flag2).toBe(false);
	});

	//   test('should apply default values for optional fields', () => {
	//     const schema = new CallbackData('defaults')
	//       .string('name', { optional: true }) // default: 'Anonymous'
	//       .number('count', { optional: true }); // default: 0

	//     const packed = schema.pack({});
	//     const unpacked = schema.unpack(packed);

	//     expect(unpacked.name).toBe('Anonymous');
	//     expect(unpacked.count).toBe(0);
	//   });

	test("should validate enum values", () => {
		const schema = new CallbackData("enums").enum(
			"status",
			["active", "inactive"],
			{
				optional: true,
				default: "active",
			},
		);

		const testData = { status: "active" as const };
		const packed = schema.pack(testData);
		console.log(packed);
		const unpacked = schema.unpack(packed);

		console.log(unpacked);
		expect(unpacked?.status).toBe("active");
	});

	test("should handle empty optional fields", () => {
		const schema = new CallbackData("optional")
			.string("comment", { optional: true })
			.number("rating", { optional: true });

		const testData = {
			/* empty */
		};
		const unpacked = schema.unpack(schema.pack(testData));

		expect(unpacked).toEqual({});
	});

	test("should handle UUID v4 and v7", () => {
		const schema = new CallbackData("uuid").uuid("id");
		const testData = { id: crypto.randomUUID() };
		const packed = schema.pack(testData);
		const unpacked = schema.unpack(packed);

		expect(unpacked?.id).toBe(testData.id);
	});

	test("Parse correctly legacy serialized data", () => {
		const schema = new CallbackData("legacy").string("name").number("age");
		const packed = `${
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			schema["legacyId"]
		}|${JSON.stringify({ name: "Alice", age: 30 })}`;
		const unpacked = schema.unpack(packed);

		expect(unpacked).toEqual({ name: "Alice", age: 30 });
	});

	test("handles UUID v7 with defaults", () => {
		const schema = new CallbackData("uuidv7").uuid("id", {
			default: "00000000-0000-7000-8000-000000000000",
		});

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.id).toBe("00000000-0000-7000-8000-000000000000");
	});

	test("handles large numbers with defaults", () => {
		const schema = new CallbackData("bigNumbers").number("big", {
			default: Number.MAX_SAFE_INTEGER,
		});

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.big).toBe(Number.MAX_SAFE_INTEGER);
	});

	test("handles boolean defaults correctly", () => {
		const schema = new CallbackData("bools")
			.boolean("active", { default: false })
			.boolean("admin", { default: true });

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.active).toBe(false);
		expect(unpacked.admin).toBe(true);
	});

	test("handles empty string default", () => {
		const schema = new CallbackData("empty").string("comment", { default: "" });

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.comment).toBe("");
	});

	test("handles zero default value", () => {
		const schema = new CallbackData("zero").number("value", { default: 0 });

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.value).toBe(0);
	});

	test("handles special characters in default strings", () => {
		const schema = new CallbackData("special").string("text", {
			default: ";base64|url\\escape",
		});

		const unpacked = schema.unpack(schema.pack({}));
		expect(unpacked.text).toBe(";base64|url\\escape");
	});
});
