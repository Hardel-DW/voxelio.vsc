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

export type ExtensionMessage =
    | { readonly type: "init"; readonly payload: InitPayload }
    | { readonly type: "settings"; readonly payload: UserSettings }
    | { readonly type: "registries"; readonly payload: RegistriesPayload }
    | { readonly type: "file"; readonly payload: FilePayload };

export type WebviewMessage =
    | { readonly type: "ready" }
    | { readonly type: "refreshRegistries" }
    | { readonly type: "changePackFormat"; readonly packFormat: number }
    | { readonly type: "requestFile"; readonly uri: string }
    | { readonly type: "saveFile"; readonly uri: string; readonly content: string }
    | { readonly type: "updateSettings"; readonly settings: Partial<UserSettings> }
    | { readonly type: "openSettings" };
