export interface PackInfo {
    readonly uri: vscode.Uri;
    readonly packFormat: number;
    readonly description?: string;
}

export interface WebviewMessage {
    readonly type: string;
    readonly payload?: unknown;
}

export interface ExtensionMessage {
    readonly type: "init" | "schema" | "registries" | "file";
    readonly payload: unknown;
}

import type * as vscode from "vscode";
