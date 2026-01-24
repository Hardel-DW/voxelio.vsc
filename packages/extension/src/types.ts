import type { Uri } from "vscode";

export interface PackInfo {
    readonly uri: Uri;
    readonly packFormat: number;
    readonly description?: string;
}

export type PackDetectionResult =
    | { readonly status: "found"; readonly pack: PackInfo }
    | { readonly status: "notFound" }
    | { readonly status: "invalid"; readonly uri: Uri; readonly reason: string };

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

export interface UserSettings {
    readonly uiScale: number;
    readonly accentColor: string;
}

export interface InitPayload {
    readonly pack: PackStatus;
    readonly settings: UserSettings;
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
    | { readonly type: "saveFile"; readonly uri: string; readonly content: string }
    | { readonly type: "updateSettings"; readonly settings: Partial<UserSettings> };
