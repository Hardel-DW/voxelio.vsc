import type { VersionConfig } from "@/types.ts";

const VERSION_MAP: ReadonlyMap<number, VersionConfig> = new Map([
    [4, { id: "1.13", ref: "1.13" }],
    [5, { id: "1.14", ref: "1.14" }],
    [6, { id: "1.15", ref: "1.15" }],
    [7, { id: "1.16", ref: "1.16" }],
    [8, { id: "1.17", ref: "1.17" }],
    [9, { id: "1.18", ref: "1.18" }],
    [10, { id: "1.18.2", ref: "1.18.2" }],
    [11, { id: "1.19", ref: "1.19" }],
    [12, { id: "1.19.3", ref: "1.19.3" }],
    [13, { id: "1.19.4", ref: "1.19.4" }],
    [15, { id: "1.20", ref: "1.20" }],
    [18, { id: "1.20.2", ref: "1.20.2" }],
    [26, { id: "1.20.3", ref: "1.20.3" }],
    [41, { id: "1.20.5", ref: "1.20.5" }],
    [48, { id: "1.21", ref: "1.21" }],
    [57, { id: "1.21.2", ref: "1.21.2" }],
    [61, { id: "1.21.4", ref: "1.21.4" }],
    [71, { id: "1.21.5", ref: "1.21.5" }],
    [82, { id: "1.21.7", ref: "1.21.7" }],
    [94, { id: "1.21.11", ref: "1.21.11" }],
]);

export function getVersionFromPackFormat(packFormat: number): VersionConfig | null {
    const exact = VERSION_MAP.get(packFormat);

    if (exact) {
        return exact;
    }

    let closest: VersionConfig | null = null;
    let closestFormat = 0;

    for (const [format, config] of VERSION_MAP) {
        if (format <= packFormat && format > closestFormat) {
            closest = config;
            closestFormat = format;
        }
    }

    return closest;
}

export function getMinecraftVersion(packFormat: number): string {
    return getVersionFromPackFormat(packFormat)?.id ?? "unknown";
}
