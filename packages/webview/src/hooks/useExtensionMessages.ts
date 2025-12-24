import { postMessage } from "@/lib/vscode.ts";
import { SpyglassService } from "@/services/SpyglassService.ts";
import { useEditorStore } from "@/stores/editor.ts";
import { useFileStore } from "@/stores/file.ts";
import { useSpyglassStore } from "@/stores/spyglass.ts";
import type { ExtensionMessage, FilePayload, VersionConfig } from "@/types.ts";

async function initializeSpyglass(version: VersionConfig): Promise<void> {
    const spyglassStore = useSpyglassStore.getState();
    spyglassStore.setLoading(true);

    try {
        const service = await SpyglassService.create(version);
        spyglassStore.setService(service);
    } catch (error) {
        spyglassStore.setError(error instanceof Error ? error.message : "Failed to initialize Spyglass");
    }
}

function extractDatapackPath(uri: string): string | null {
    // Match pattern: .../data/namespace/type/... or .../data/namespace/tags/type/...
    const match = uri.match(/[/\\](data[/\\].+\.json)$/i);
    if (!match) return null;
    return match[1].replace(/\\/g, "/");
}

async function handleFileReceived(payload: FilePayload): Promise<void> {
    const spyglassStore = useSpyglassStore.getState();
    const fileStore = useFileStore.getState();
    const service = spyglassStore.service;

    if (!service) {
        console.warn("SpyglassService not initialized, cannot process file");
        return;
    }

    const datapackPath = extractDatapackPath(payload.uri);
    if (!datapackPath) {
        console.warn("File is not in a valid datapack structure:", payload.uri);
        return;
    }

    const virtualUri = `file:///root/${datapackPath}`;
    await service.writeFile(virtualUri, payload.content);
    const docAndNode = await service.openFile(virtualUri);

    if (docAndNode) {
        fileStore.setFile(payload.uri, virtualUri, docAndNode);
    }
}

function handleMessage(event: MessageEvent<ExtensionMessage>): void {
    const message = event.data;
    const store = useEditorStore.getState();

    switch (message.type) {
        case "init": {
            store.setPackFormat(message.payload.packFormat);
            if (message.payload.version) {
                store.setVersion(message.payload.version);
                initializeSpyglass(message.payload.version);
            }
            break;
        }
        case "registries": {
            store.setRegistries(message.payload);
            break;
        }
        case "file": {
            handleFileReceived(message.payload);
            break;
        }
    }
}

let initialized = false;

export function useExtensionMessages(): void {
    if (initialized) return;
    initialized = true;

    window.addEventListener("message", handleMessage);
    postMessage({ type: "ready" });
}
