import type { WebviewMessage } from "@/types.ts";

interface PersistedState {
    realUri?: string;
    virtualUri?: string;
}

interface VsCodeApi {
    postMessage(message: unknown): void;
    getState(): PersistedState | undefined;
    setState(state: PersistedState): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export function postMessage(message: WebviewMessage): void {
    vscode.postMessage(message);
}

export function getPersistedState(): PersistedState | undefined {
    return vscode.getState();
}

export function setPersistedState(state: PersistedState): void {
    vscode.setState(state);
}

export function requestFile(uri: string): void {
    postMessage({ type: "requestFile", uri });
}

export function saveFile(uri: string, content: string): void {
    postMessage({ type: "saveFile", uri, content });
}
