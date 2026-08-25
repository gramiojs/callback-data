import { describe, expect, test } from "bun:test";
import { CallbackData, decode, embed, encode, extract } from "../src/index.ts";

describe("text codec", () => {
	test("round-trips ASCII, Cyrillic, and emoji", () => {
		for (const data of ["qh31PDhome;42", "привет", "go 🏠 home 🎉"])
			expect(decode(encode(data))).toBe(data);
	});

	test("embeds a payload without changing visible text", () => {
		expect(extract(embed("◀ Back", "payload-1"))).toEqual({
			visible: "◀ Back",
			data: "payload-1",
		});
	});

	test("ignores text without a complete invisible suffix", () => {
		expect(extract("just a normal message")).toBeUndefined();
		expect(extract("")).toBeUndefined();
		expect(extract("hello\u200B")).toBeUndefined();
		expect(decode("\u200B\u200C\u200D")).toBeUndefined();
	});

	test("uses only single UTF-16 code-unit symbols", () => {
		const value = "\0ÿ";
		const suffix = encode(value);
		for (const symbol of suffix) expect(symbol.length).toBe(1);
		expect([...suffix]).toHaveLength(
			2 * new TextEncoder().encode(value).length,
		);
	});

	test("round-trips packed CallbackData", () => {
		const navigation = new CallbackData("nav").enum("to", ["home", "settings"]);
		const packed = navigation.pack({ to: "settings" });
		const extracted = extract(embed("⚙️ Settings", packed));

		expect(extracted?.data).toBe(packed);
		expect(navigation.filter(extracted?.data ?? "")).toBe(true);
		expect(navigation.safeUnpack(extracted?.data ?? "")).toEqual({
			success: true,
			data: { to: "settings" },
		});
	});
});
