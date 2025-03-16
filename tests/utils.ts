export function getBytesLength(str: string | object) {
    return new TextEncoder().encode(typeof str === "string" ? str : JSON.stringify(str)).byteLength;
}