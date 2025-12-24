import type { WebviewMessage } from "@/types.ts";

interface VsCodeApi {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export function postMessage(message: WebviewMessage): void {
    vscode.postMessage(message);
}

export function requestFile(uri: string): void {
    postMessage({ type: "requestFile", uri });
}

export function saveFile(uri: string, content: string): void {
    postMessage({ type: "saveFile", uri, content });
}
