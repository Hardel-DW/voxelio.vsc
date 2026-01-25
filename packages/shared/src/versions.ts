import type { VersionConfig } from "./types.ts";

export type PackType = "datapack" | "resourcepack";

export interface VersionOption {
    readonly packFormat: number;
    readonly version: VersionConfig;
}

export const DATAPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 4, version: { id: "1.13", ref: "1.13" } },
    { packFormat: 5, version: { id: "1.14", ref: "1.14" } },
    { packFormat: 6, version: { id: "1.15", ref: "1.15" } },
    { packFormat: 7, version: { id: "1.16", ref: "1.16" } },
    { packFormat: 8, version: { id: "1.17", ref: "1.17" } },
    { packFormat: 9, version: { id: "1.18", ref: "1.18" } },
    { packFormat: 10, version: { id: "1.18.2", ref: "1.18.2" } },
    { packFormat: 11, version: { id: "1.19", ref: "1.19" } },
    { packFormat: 12, version: { id: "1.19.3", ref: "1.19.3" } },
    { packFormat: 13, version: { id: "1.19.4", ref: "1.19.4" } },
    { packFormat: 15, version: { id: "1.20", ref: "1.20" } },
    { packFormat: 18, version: { id: "1.20.2", ref: "1.20.2" } },
    { packFormat: 26, version: { id: "1.20.3", ref: "1.20.3" } },
    { packFormat: 41, version: { id: "1.20.5", ref: "1.20.5" } },
    { packFormat: 48, version: { id: "1.21", ref: "1.21" } },
    { packFormat: 57, version: { id: "1.21.2", ref: "1.21.2" } },
    { packFormat: 61, version: { id: "1.21.4", ref: "1.21.4" } },
    { packFormat: 71, version: { id: "1.21.5", ref: "1.21.5" } },
    { packFormat: 82, version: { id: "1.21.7", ref: "1.21.7" } },
    { packFormat: 94, version: { id: "1.21.11", ref: "1.21.11" } }
];

export const RESOURCEPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 1, version: { id: "1.6.1", ref: "1.6.1" } },
    { packFormat: 2, version: { id: "1.9", ref: "1.9" } },
    { packFormat: 3, version: { id: "1.11", ref: "1.11" } },
    { packFormat: 4, version: { id: "1.13", ref: "1.13" } },
    { packFormat: 5, version: { id: "1.15", ref: "1.15" } },
    { packFormat: 6, version: { id: "1.16.2", ref: "1.16.2" } },
    { packFormat: 7, version: { id: "1.17", ref: "1.17" } },
    { packFormat: 8, version: { id: "1.18", ref: "1.18" } },
    { packFormat: 9, version: { id: "1.19", ref: "1.19" } },
    { packFormat: 12, version: { id: "1.19.3", ref: "1.19.3" } },
    { packFormat: 13, version: { id: "1.19.4", ref: "1.19.4" } },
    { packFormat: 15, version: { id: "1.20", ref: "1.20" } },
    { packFormat: 18, version: { id: "1.20.2", ref: "1.20.2" } },
    { packFormat: 22, version: { id: "1.20.3", ref: "1.20.3" } },
    { packFormat: 32, version: { id: "1.20.5", ref: "1.20.5" } },
    { packFormat: 34, version: { id: "1.21", ref: "1.21" } },
    { packFormat: 42, version: { id: "1.21.2", ref: "1.21.2" } },
    { packFormat: 46, version: { id: "1.21.4", ref: "1.21.4" } },
    { packFormat: 55, version: { id: "1.21.5", ref: "1.21.5" } },
    { packFormat: 63, version: { id: "1.21.6", ref: "1.21.6" } },
    { packFormat: 64, version: { id: "1.21.7", ref: "1.21.7" } },
    { packFormat: 65, version: { id: "1.21.9", ref: "1.21.9" } },
    { packFormat: 75, version: { id: "1.21.11", ref: "1.21.11" } }
];

export function getVersionsForPackType(packType: PackType): readonly VersionOption[] {
    return packType === "datapack" ? DATAPACK_VERSIONS : RESOURCEPACK_VERSIONS;
}

export function getVersionFromPackFormat(packFormat: number, packType: PackType = "datapack"): VersionConfig | null {
    const versions = getVersionsForPackType(packType);
    const exact = versions.find((v) => v.packFormat === packFormat);
    if (exact) return exact.version;

    let closest: VersionOption | null = null;
    for (const option of versions) {
        if (option.packFormat <= packFormat && (!closest || option.packFormat > closest.packFormat)) {
            closest = option;
        }
    }

    return closest?.version ?? null;
}

export function getMinecraftVersion(packFormat: number, packType: PackType = "datapack"): string {
    return getVersionFromPackFormat(packFormat, packType)?.id ?? "unknown";
}
