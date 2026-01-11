import type { DocAndNode } from "@spyglassmc/core";
import { dissectUri } from "@spyglassmc/java-edition/lib/binder/index.js";
import type { JSX } from "preact";
import { useSyncExternalStore } from "preact/compat";
import { useState } from "preact/hooks";
import { EmptyState } from "@/components/EmptyState.tsx";
import { Footer } from "@/components/Footer.tsx";
import { Header } from "@/components/Header.tsx";
import { Octicon } from "@/components/Icons.tsx";
import { JsonFileView } from "@/components/JsonFileView.tsx";
import { WikiLink } from "@/components/WikiLink.tsx";
import { getWikiLabel, getWikiUrl } from "@/config.ts";
import { getPersistedState, postMessage, setPersistedState } from "@/lib/vscode.ts";
import type { SpyglassService } from "@/services/SpyglassService.ts";
import { SpyglassService as SpyglassServiceClass } from "@/services/SpyglassService.ts";
import type { ExtensionMessage, RegistriesPayload, VersionConfig, WebviewMessage } from "@/types.ts";

interface AppState {
    packFormat: number | null;
    version: VersionConfig | null;
    registries: RegistriesPayload | null;
    service: SpyglassService | null;
    docAndNode: DocAndNode | null;
    virtualUri: string | null;
    realUri: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: AppState = {
    packFormat: null,
    version: null,
    registries: null,
    service: null,
    docAndNode: null,
    virtualUri: null,
    realUri: null,
    loading: false,
    error: null
};

let state = initialState;
const listeners = new Set<() => void>();

function setState(partial: Partial<AppState>): void {
    state = { ...state, ...partial };
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): AppState {
    return state;
}

function extractDatapackPath(uri: string): string | null {
    const match = uri.match(/[/\\](data[/\\].+\.json)$/i);
    if (!match) return null;
    return match[1].replace(/\\/g, "/");
}

async function handleInit(packFormat: number, version: VersionConfig): Promise<void> {
    setState({ packFormat, version, error: null, service: null, registries: null });
    tryCreateService();
}

async function handleRegistries(registries: RegistriesPayload): Promise<void> {
    const { service, version, virtualUri } = state;
    setState({ registries });

    if (!service || !version) {
        tryCreateService();
        return;
    }

    const currentContent = virtualUri ? await service.readFile(virtualUri) : undefined;
    const newService = await SpyglassServiceClass.create(version, registries);

    if (!currentContent || !virtualUri) {
        setState({ service: newService });
        return;
    }

    await newService.writeFile(virtualUri, currentContent);
    const docAndNode = await newService.openFile(virtualUri);
    if (!docAndNode) {
        setState({ service: newService });
        return;
    }

    setState({ service: newService, docAndNode });
    newService.watchFile(virtualUri, onDocumentUpdated);
}

async function tryCreateService(): Promise<void> {
    const { version, registries, service, loading } = state;
    if (!version || !registries || service || loading) return;

    setState({ loading: true });
    try {
        const newService = await SpyglassServiceClass.create(version, registries);
        setState({ service: newService, loading: false });
    } catch (err) {
        setState({ error: err instanceof Error ? err.message : "Failed to init", loading: false });
    }
}

async function handleFile(realUri: string, content: string): Promise<void> {
    const { service, virtualUri: oldVirtualUri } = state;
    if (!service) return;

    const datapackPath = extractDatapackPath(realUri);
    if (!datapackPath) return;

    const virtualUri = `file:///root/${datapackPath}`;
    if (oldVirtualUri && oldVirtualUri !== virtualUri) {
        service.unwatchFile(oldVirtualUri, onDocumentUpdated);
    }

    await service.writeFile(virtualUri, content);
    const docAndNode = await service.openFile(virtualUri);

    if (docAndNode) {
        setState({ docAndNode, virtualUri, realUri });
        setPersistedState({ realUri, virtualUri });
        service.watchFile(virtualUri, onDocumentUpdated);
    }
}

function onDocumentUpdated(docAndNode: DocAndNode): void {
    setState({ docAndNode });
    const { realUri, service, virtualUri } = state;
    if (realUri && service && virtualUri) {
        service.readFile(virtualUri).then((content) => {
            if (content) {
                postMessage({ type: "saveFile", uri: realUri, content });
            }
        });
    }
}

function handleMessage(event: MessageEvent<ExtensionMessage>): void {
    const msg = event.data;
    switch (msg.type) {
        case "init":
            if (msg.payload.version) {
                handleInit(msg.payload.packFormat, msg.payload.version);
            } else {
                setState({ packFormat: msg.payload.packFormat, error: msg.payload.error ?? null });
            }
            break;
        case "registries":
            handleRegistries(msg.payload);
            break;
        case "file":
            handleFile(msg.payload.uri, msg.payload.content);
            break;
    }
}

let initialized = false;

function initMessageListener(): void {
    if (initialized) return;
    initialized = true;
    window.addEventListener("message", handleMessage);
    postMessage({ type: "ready" });

    const persisted = getPersistedState();
    if (persisted?.realUri) {
        postMessage({ type: "requestFile", uri: persisted.realUri });
    }
}

export function App(): JSX.Element | null {
    useState(() => {
        initMessageListener();
        return true;
    });

    const { packFormat, version, registries, service, docAndNode, loading, error } = useSyncExternalStore(subscribe, getSnapshot);

    if (error) {
        return (
            <div class="editor-layout">
                {version && packFormat && (
                    <Header
                        packFormat={packFormat}
                        versionId={version.id}
                        onPackFormatChange={(newPackFormat) =>
                            postMessage({ type: "changePackFormat", packFormat: newPackFormat } satisfies WebviewMessage)
                        }
                    />
                )}
                <EmptyState icon={Octicon.alert} title="Error" description={error} />
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.loader} title="Loading Spyglass..." />
                <Footer />
            </div>
        );
    }

    if (!packFormat || !version) {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.loader} title="Waiting for pack info..." />
                <Footer />
            </div>
        );
    }

    if (!registries) {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.loader} title="Loading registries..." />
                <Footer />
            </div>
        );
    }

    if (!service) {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.loader} title="Initializing Spyglass..." />
                <Footer />
            </div>
        );
    }

    const handlePackFormatChange = (newPackFormat: number): void => {
        postMessage({ type: "changePackFormat", packFormat: newPackFormat } satisfies WebviewMessage);
    };

    const getResourceType = (): string | undefined => {
        if (!docAndNode || !service) return undefined;
        if (docAndNode.doc.uri.endsWith("/pack.mcmeta")) return "pack_mcmeta";
        const ctx = service.getCheckerContext(docAndNode.doc, []);
        return dissectUri(docAndNode.doc.uri, ctx)?.category;
    };

    const resourceType = getResourceType();
    const wikiUrl = getWikiUrl(resourceType);
    const wikiLabel = getWikiLabel(resourceType);

    return (
        <div class="editor-layout">
            <div class="editor-content">
                <Header packFormat={packFormat} versionId={version.id} onPackFormatChange={handlePackFormatChange} />
                {docAndNode ? (
                    <>
                        <JsonFileView docAndNode={docAndNode} service={service} />
                        {wikiUrl && wikiLabel && <WikiLink url={wikiUrl} label={wikiLabel} />}
                    </>
                ) : (
                    <EmptyState
                        icon={Octicon.file_code}
                        title="No file open"
                        description="Open a JSON file in the data folder to start editing."
                    />
                )}
            </div>
            <Footer />
        </div>
    );
}
