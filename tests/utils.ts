export function getBytesLength(str: string | object) {
	return new TextEncoder().encode(
		typeof str === "string" ? str : JSON.stringify(str),
	).byteLength;
}

console.log(
	getBytesLength("base64url".repeat(100)),
	getBytesLength(Buffer.from("base64url".repeat(100)).toString("base64url")),
);

export function formatMemoryUsage(memory: NodeJS.MemoryUsage): string {
	const format = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

	return `Memory usage:
  RSS: ${format(memory.rss)} (Resident Set Size)
  Heap Total: ${format(memory.heapTotal)}
  Heap Used: ${format(memory.heapUsed)}
  External: ${format(memory.external)}
  ArrayBuffers: ${format(memory.arrayBuffers)}`;
}

export function compareMemoryUsage(
	before: NodeJS.MemoryUsage,
	after: NodeJS.MemoryUsage,
): string {
	const diff: Partial<NodeJS.MemoryUsage> = {};
	const keys = [
		"rss",
		"heapTotal",
		"heapUsed",
		"external",
		"arrayBuffers",
	] as const;

	for (const key of keys) {
		diff[key] = after[key] - before[key];
	}

	return `Memory difference:
${formatMemoryUsage(diff as NodeJS.MemoryUsage)}`;
}

export function generateMixedUUIDs(count: number): string[] {
	const uuids: string[] = [];

	for (let i = 0; i < count; i++) {
		const uuid = i % 2 === 0 ? crypto.randomUUID() : Bun.randomUUIDv7();

		uuids.push(uuid);
	}

	return uuids;
}
