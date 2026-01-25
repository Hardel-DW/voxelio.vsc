export interface VersionOption {
    packFormat: number;
    versionId: string;
}

export type PackType = "datapack" | "resourcepack";

export const DATAPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 4, versionId: "1.13" },
    { packFormat: 5, versionId: "1.14" },
    { packFormat: 6, versionId: "1.15" },
    { packFormat: 7, versionId: "1.16" },
    { packFormat: 8, versionId: "1.17" },
    { packFormat: 9, versionId: "1.18" },
    { packFormat: 10, versionId: "1.18.2" },
    { packFormat: 11, versionId: "1.19" },
    { packFormat: 12, versionId: "1.19.3" },
    { packFormat: 13, versionId: "1.19.4" },
    { packFormat: 15, versionId: "1.20" },
    { packFormat: 18, versionId: "1.20.2" },
    { packFormat: 26, versionId: "1.20.3" },
    { packFormat: 41, versionId: "1.20.5" },
    { packFormat: 48, versionId: "1.21" },
    { packFormat: 57, versionId: "1.21.2" },
    { packFormat: 61, versionId: "1.21.4" },
    { packFormat: 71, versionId: "1.21.5" },
    { packFormat: 82, versionId: "1.21.7" },
    { packFormat: 94, versionId: "1.21.11" }
];

export const RESOURCEPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 1, versionId: "1.6.1" },
    { packFormat: 2, versionId: "1.9" },
    { packFormat: 3, versionId: "1.11" },
    { packFormat: 4, versionId: "1.13" },
    { packFormat: 5, versionId: "1.15" },
    { packFormat: 6, versionId: "1.16.2" },
    { packFormat: 7, versionId: "1.17" },
    { packFormat: 8, versionId: "1.18" },
    { packFormat: 9, versionId: "1.19" },
    { packFormat: 12, versionId: "1.19.3" },
    { packFormat: 13, versionId: "1.19.4" },
    { packFormat: 15, versionId: "1.20" },
    { packFormat: 18, versionId: "1.20.2" },
    { packFormat: 22, versionId: "1.20.3" },
    { packFormat: 32, versionId: "1.20.5" },
    { packFormat: 34, versionId: "1.21" },
    { packFormat: 42, versionId: "1.21.2" },
    { packFormat: 46, versionId: "1.21.4" },
    { packFormat: 55, versionId: "1.21.5" },
    { packFormat: 63, versionId: "1.21.6" },
    { packFormat: 64, versionId: "1.21.7" },
    { packFormat: 65, versionId: "1.21.9" },
    { packFormat: 75, versionId: "1.21.11" }
];

export function getVersionsForPackType(packType: PackType): readonly VersionOption[] {
    return packType === "datapack" ? DATAPACK_VERSIONS : RESOURCEPACK_VERSIONS;
}
