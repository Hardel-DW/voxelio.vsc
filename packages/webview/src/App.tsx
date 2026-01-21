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
import type { ExtensionMessage, PackStatus, RegistriesPayload, VersionConfig, WebviewMessage } from "@/types.ts";

type PackState =
    | { status: "loading" }
    | { status: "notFound" }
    | { status: "invalid"; reason: string }
    | { status: "ready"; packFormat: number; version: VersionConfig };

interface PendingFile {
    uri: string;
    content: string;
}

interface AppState {
    packState: PackState;
    registries: RegistriesPayload | null;
    service: SpyglassService | null;
    docAndNode: DocAndNode | null;
    virtualUri: string | null;
    realUri: string | null;
    loading: boolean;
    error: string | null;
    pendingFile: PendingFile | null;
}

const initialState: AppState = {
    packState: { status: "loading" },
    registries: null,
    service: null,
    docAndNode: null,
    virtualUri: null,
    realUri: null,
    loading: false,
    error: null,
    pendingFile: null
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

function extractPackPath(uri: string): string | null {
    const match = uri.match(/[/\\]((?:data|assets)[/\\].+\.json)$/i);
    if (!match) return null;
    return match[1].replace(/\\/g, "/");
}

function handleInit(pack: PackStatus): void {
    if (pack.state === "notFound") {
        setState({ packState: { status: "notFound" }, error: null, service: null, registries: null });
        return;
    }

    if (pack.state === "invalid") {
        setState({ packState: { status: "invalid", reason: pack.reason }, error: null, service: null, registries: null });
        return;
    }

    setState({
        packState: { status: "ready", packFormat: pack.packFormat, version: pack.version },
        error: null,
        service: null,
        registries: null
    });
    tryCreateService();
}

async function handleRegistries(registries: RegistriesPayload): Promise<void> {
    const { service, packState, virtualUri } = state;
    setState({ registries });

    const version = packState.status === "ready" ? packState.version : null;

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
    const { packState, registries, service, loading, pendingFile, virtualUri } = state;
    if (packState.status !== "ready" || !registries || service || loading) return;

    setState({ loading: true });
    try {
        const newService = await SpyglassServiceClass.create(packState.version, registries);
        setState({ service: newService, loading: false });

        if (pendingFile) {
            await processFile(newService, pendingFile.uri, pendingFile.content, virtualUri);
        }
    } catch (err) {
        setState({ error: err instanceof Error ? err.message : "Failed to init", loading: false });
    }
}

async function handleFile(realUri: string, content: string): Promise<void> {
    const { service, virtualUri: oldVirtualUri } = state;

    if (!service) {
        setState({ pendingFile: { uri: realUri, content } });
        return;
    }

    await processFile(service, realUri, content, oldVirtualUri);
}

async function processFile(service: SpyglassService, realUri: string, content: string, oldVirtualUri: string | null): Promise<void> {
    const packPath = extractPackPath(realUri);
    if (!packPath) return;

    const virtualUri = `file:///root/${packPath}`;
    if (oldVirtualUri && oldVirtualUri !== virtualUri) {
        service.unwatchFile(oldVirtualUri, onDocumentUpdated);
    }

    await service.writeFile(virtualUri, content);
    const docAndNode = await service.openFile(virtualUri);

    if (docAndNode) {
        setState({ docAndNode, virtualUri, realUri, pendingFile: null });
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
            handleInit(msg.payload.pack);
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

    const { packState, registries, service, docAndNode, loading, error } = useSyncExternalStore(subscribe, getSnapshot);

    if (packState.status === "loading" || packState.status === "notFound") {
        return (
            <div class="editor-layout">
                <EmptyState
                    icon={Octicon.file_code}
                    title="No file open"
                    description="Open a JSON file inside a datapack to start editing."
                />
                <Footer />
            </div>
        );
    }

    if (packState.status === "invalid") {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.alert} title="Invalid pack.mcmeta" description={packState.reason} />
                <Footer />
            </div>
        );
    }

    const { packFormat, version } = packState;

    if (error) {
        return (
            <div class="editor-layout">
                <Header
                    packFormat={packFormat}
                    versionId={version.id}
                    onPackFormatChange={(newPackFormat) =>
                        postMessage({ type: "changePackFormat", packFormat: newPackFormat } satisfies WebviewMessage)
                    }
                />
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
