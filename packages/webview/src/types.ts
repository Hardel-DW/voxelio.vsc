export interface VersionConfig {
    readonly id: string;
    readonly ref: string;
    readonly dynamic?: boolean;
}

export type PackStatus =
    | { readonly state: "found"; readonly packFormat: number; readonly version: VersionConfig }
    | { readonly state: "notFound" }
    | { readonly state: "invalid"; readonly reason: string };

export interface InitPayload {
    readonly pack: PackStatus;
}

export interface RegistriesPayload {
    readonly [registry: string]: string[];
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
