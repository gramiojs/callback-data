/**
 * @module
 *
 * Zero-width text codec for attaching callback data to reply-keyboard labels.
 */

const SYMBOLS = [
	"\u200B",
	"\u200C",
	"\u200D",
	"\u2060",
	"\u2061",
	"\u2062",
	"\u2063",
	"\u2064",
	"\uFE00",
	"\uFE01",
	"\uFE02",
	"\uFE03",
	"\uFE04",
	"\uFE05",
	"\uFE06",
	"\uFE07",
] as const;

const INDEX = new Map<string, number>(SYMBOLS.map((symbol, i) => [symbol, i]));
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Encode a string as an invisible base-16 UTF-8 suffix. */
export function encode(data: string): string {
	let result = "";

	for (const byte of encoder.encode(data)) {
		result += SYMBOLS[byte & 0x0f];
		result += SYMBOLS[byte >> 4];
	}

	return result;
}

/** Decode an invisible suffix created by {@link encode}. */
export function decode(suffix: string): string | undefined {
	const symbols = [...suffix];
	if (symbols.length < 2 || symbols.length % 2 !== 0) return undefined;

	const bytes: number[] = [];
	for (let i = 0; i < symbols.length; i += 2) {
		const low = INDEX.get(symbols[i] as string);
		const high = INDEX.get(symbols[i + 1] as string);
		if (low === undefined || high === undefined) return undefined;

		bytes.push(low | (high << 4));
	}

	return decoder.decode(new Uint8Array(bytes));
}

/** Append an invisible payload to human-visible text. */
export function embed(visible: string, data: string): string {
	return visible + encode(data);
}

/** Extract a trailing invisible payload and the human-visible text. */
export function extract(
	text: string,
): { visible: string; data: string } | undefined {
	if (text.length === 0 || !INDEX.has(text[text.length - 1] as string))
		return undefined;

	const symbols = [...text];
	let start = symbols.length;
	while (start > 0 && INDEX.has(symbols[start - 1] as string)) start--;

	const data = decode(symbols.slice(start).join(""));
	if (data === undefined) return undefined;

	return {
		visible: symbols.slice(0, start).join("").trimEnd(),
		data,
	};
}
