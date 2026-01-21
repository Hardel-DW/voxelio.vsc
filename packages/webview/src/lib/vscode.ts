import type { WebviewMessage } from "@/types.ts";

interface PersistedState {
    realUri?: string;
    virtualUri?: string;
    uiScale?: number;
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

export const MIN_SCALE = 1;
export const MAX_SCALE = 20;
export const DEFAULT_SCALE = 1;

export function getUiScale(): number {
    return getPersistedState()?.uiScale ?? DEFAULT_SCALE;
}

export function setUiScale(scale: number): void {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    const state = getPersistedState() ?? {};
    setPersistedState({ ...state, uiScale: clamped });
    applyUiScale(clamped);
}

export function applyUiScale(scale: number): void {
    document.documentElement.style.setProperty("--ui-scale", String(scale));
}
