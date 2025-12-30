import type { Uri } from "vscode";

export interface PackInfo {
    readonly uri: Uri;
    readonly packFormat: number;
    readonly description?: string;
}

export interface VersionConfig {
    readonly id: string;
    readonly ref: string;
    readonly dynamic?: boolean;
}

export interface InitPayload {
    readonly packFormat: number;
    readonly version?: VersionConfig;
    readonly error?: string;
}

export interface RegistriesPayload {
    readonly [registry: string]: readonly string[];
}

export interface MutableRegistries {
    [registry: string]: string[];
}

export interface FilePayload {
    readonly uri: string;
    readonly content: string;
}

export type ExtensionMessage =
    | { readonly type: "init"; readonly payload: InitPayload }
    | { readonly type: "registries"; readonly payload: RegistriesPayload }
    | { readonly type: "file"; readonly payload: FilePayload };

export type WebviewMessage =
    | { readonly type: "ready" }
    | { readonly type: "refreshRegistries" }
    | { readonly type: "changePackFormat"; readonly packFormat: number }
    | { readonly type: "requestFile"; readonly uri: string }
    | { readonly type: "saveFile"; readonly uri: string; readonly content: string };
