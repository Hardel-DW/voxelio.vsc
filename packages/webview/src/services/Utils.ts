// Misode: Utils.ts - Utility functions for node comfort features

// Misode: Utils.ts:24-31
function decToHex(n: number): string {
    return n.toString(16).padStart(2, "0");
}

// Misode: Utils.ts:28-32
export function hexId(length = 12): string {
    const arr = new Uint8Array(length / 2);
    crypto.getRandomValues(arr);
    return Array.from(arr, decToHex).join("");
}

// Misode: Utils.ts:34-36
export function randomSeed(): bigint {
    return BigInt(Math.floor((Math.random() - 0.5) * 2 * Number.MAX_SAFE_INTEGER));
}

// Misode: Utils.ts:38-40
export function randomInt(): number {
    return Math.floor(Math.random() * 4294967296) - 2147483648;
}

// Misode: Utils.ts:42-48
export function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Misode: Utils.ts:50-52
export function generateColor(): number {
    return Math.floor(Math.random() * 16777215);
}

// Misode: Utils.ts:59-61
export function intToHexRgb(c: number | undefined): string {
    return c ? `#${(c & 0xffffff).toString(16).padStart(6, "0")}` : "#000000";
}
