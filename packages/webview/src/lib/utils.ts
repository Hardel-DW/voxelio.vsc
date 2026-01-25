export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
export type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;

function toVal(mix: ClassValue): string {
    if (typeof mix === "string" || typeof mix === "number") {
        return String(mix);
    }

    if (Array.isArray(mix)) {
        return mix
            .map((item: ClassValue) => toVal(item))
            .filter(Boolean)
            .join(" ");
    }

    if (typeof mix === "object" && mix !== null) {
        return Object.keys(mix)
            .filter((key) => mix[key])
            .join(" ");
    }

    return "";
}

export const clsx = (...args: ClassValue[]) =>
    args
        .map((arg) => toVal(arg))
        .filter(Boolean)
        .join(" ");
