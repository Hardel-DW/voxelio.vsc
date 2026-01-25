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

export type ExtensionMessage =
    | { readonly type: "init"; readonly payload: InitPayload }
    | { readonly type: "settings"; readonly payload: UserSettings }
    | { readonly type: "registries"; readonly payload: RegistriesPayload }
    | { readonly type: "file"; readonly payload: FilePayload }
    | { readonly type: "unsupportedFile"; readonly payload: UnsupportedFilePayload };

export type WebviewMessage =
    | { readonly type: "ready" }
    | { readonly type: "refreshRegistries" }
    | { readonly type: "changePackFormat"; readonly packFormat: number }
    | { readonly type: "requestFile"; readonly uri: string }
    | { readonly type: "saveFile"; readonly uri: string; readonly content: string }
    | { readonly type: "updateSettings"; readonly settings: Partial<UserSettings> }
    | { readonly type: "openSettings" };

// Data fetching types (shared between extension and webview)
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

// Pack detection types (used by extension)
export interface PackInfo {
    readonly packFormat: number;
    readonly description?: string;
}

export type PackDetectionResult =
    | { readonly status: "found"; readonly pack: PackInfo & { readonly uri: string } }
    | { readonly status: "notFound" }
    | { readonly status: "invalid"; readonly uri: string; readonly reason: string };

// Utility function for registry parsing (shared logic)
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
