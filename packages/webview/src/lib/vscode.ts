interface VsCodeApi {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

export const vscode = acquireVsCodeApi();

export function postMessage<T>(type: string, payload?: T): void {
    vscode.postMessage({ type, payload });
}
