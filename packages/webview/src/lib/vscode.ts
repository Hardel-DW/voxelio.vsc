import type { WebviewMessage } from "@/types.ts";

export type UiScale = "small" | "medium" | "large";

interface PersistedState {
    realUri?: string;
    virtualUri?: string;
    uiScale?: UiScale;
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

const SCALE_ORDER: UiScale[] = ["small", "medium", "large"];

export function getUiScale(): UiScale {
    return getPersistedState()?.uiScale ?? "small";
}

export function setUiScale(scale: UiScale): void {
    const state = getPersistedState() ?? {};
    setPersistedState({ ...state, uiScale: scale });
    applyUiScale(scale);
}

export function cycleUiScale(): UiScale {
    const current = getUiScale();
    const currentIndex = SCALE_ORDER.indexOf(current);
    const nextIndex = (currentIndex + 1) % SCALE_ORDER.length;
    const next = SCALE_ORDER[nextIndex];
    setUiScale(next);
    return next;
}

export function applyUiScale(scale: UiScale): void {
    document.body.dataset.scale = scale === "small" ? "" : scale;
}
