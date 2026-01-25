export interface VersionConfig {
    readonly id: string;
    readonly ref: string;
    readonly dynamic?: boolean;
}

export type PackStatus =
    | { readonly state: "found"; readonly packFormat: number; readonly version: VersionConfig }
    | { readonly state: "notFound" }
    | { readonly state: "noPackMeta" }
    | { readonly state: "invalid"; readonly reason: string };

export interface ColorSettings {
    readonly primary: string;
    readonly text: string;
    readonly add: string;
    readonly remove: string;
    readonly selected: string;
    readonly warning: string;
    readonly error: string;
    readonly predicate: string;
    readonly function: string;
    readonly pool: string;
}

export interface UserSettings {
    readonly uiScale: number;
    readonly largeFileThreshold: number;
    readonly colors: ColorSettings;
}

export interface InitPayload {
    readonly pack: PackStatus;
    readonly settings: UserSettings;
}

export interface RegistriesPayload {
    readonly [registry: string]: string[];
}

export interface MutableRegistries {
    [registry: string]: string[];
}

export interface FileFormat {
    readonly tabSize: number;
    readonly insertSpaces: boolean;
    readonly eol: "\n" | "\r\n";
}

export interface FilePayload {
    readonly uri: string;
    readonly content: string;
    readonly format: FileFormat;
}

export interface UnsupportedFilePayload {
    readonly uri: string;
    readonly reason: string;
}

export interface McdocFile {
    readonly uri: string;
    readonly content: string;
}

export interface McdocFilesPayload {
    readonly files: readonly McdocFile[];
}

export interface CustomResourceConfig {
    readonly category: string;
    readonly pack?: "data" | "assets";
}

export interface SpyglassConfig {
    readonly env?: {
        readonly customResources?: Record<string, CustomResourceConfig>;
    };
}

export interface RegistriesMessage {
    readonly registries: RegistriesPayload;
    readonly spyglassConfig: SpyglassConfig | null;
}

export type ExtensionMessage =
    | { readonly type: "init"; readonly payload: InitPayload }
    | { readonly type: "settings"; readonly payload: UserSettings }
    | { readonly type: "registries"; readonly payload: RegistriesMessage }
    | { readonly type: "file"; readonly payload: FilePayload }
    | { readonly type: "unsupportedFile"; readonly payload: UnsupportedFilePayload }
    | { readonly type: "mcdocFiles"; readonly payload: McdocFilesPayload };

export type WebviewMessage =
    | { readonly type: "ready" }
    | { readonly type: "refreshRegistries" }
    | { readonly type: "changePackFormat"; readonly packFormat: number }
    | { readonly type: "requestFile"; readonly uri: string }
    | { readonly type: "saveFile"; readonly uri: string; readonly content: string }
    | { readonly type: "updateSettings"; readonly settings: Partial<UserSettings> }
    | { readonly type: "openSettings" };

export interface VanillaMcdocSymbols {
    readonly ref: string;
    readonly mcdoc: Record<string, unknown>;
    readonly "mcdoc/dispatcher": Record<string, Record<string, unknown>>;
}

export interface VersionMeta {
    readonly id: string;
    readonly name: string;
    readonly data_pack_version: number;
    readonly resource_pack_version: number;
}

export type BlockStateData = [Record<string, string[]>, Record<string, string>];
export interface PackInfo {
    readonly packFormat: number;
    readonly description?: string;
}

export type PackDetectionResult =
    | { readonly status: "found"; readonly pack: PackInfo & { readonly uri: string } }
    | { readonly status: "notFound" }
    | { readonly status: "invalid"; readonly uri: string; readonly reason: string };

export function parseRegistries(data: Record<string, string[]>): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [id, values] of Object.entries(data)) {
        result.set(
            id,
            values.map((e) => `minecraft:${e}`)
        );
    }
    return result;
}
