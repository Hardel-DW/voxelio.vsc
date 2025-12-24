import { postMessage } from "@/lib/vscode.ts";
import { useEditorStore } from "@/stores/editor.ts";
import type { ExtensionMessage, InitPayload } from "@/types.ts";

function handleMessage(event: MessageEvent<ExtensionMessage>): void {
    const { type, payload } = event.data;

    switch (type) {
        case "init": {
            const { packFormat } = payload as InitPayload;
            useEditorStore.getState().setPackFormat(packFormat);
            break;
        }
    }
}

let initialized = false;

export function useExtensionMessages(): void {
    if (initialized) return;
    initialized = true;

    window.addEventListener("message", handleMessage);
    postMessage("ready");
}
