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
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { WikiLink } from "@/components/WikiLink.tsx";
import { getWikiLabel, getWikiUrl } from "@/config.ts";
import { applyColorSettings } from "@/lib/colors.ts";
import { getManualPackFormat, getPersistedState, postMessage, setManualPackFormat, setPersistedState } from "@/lib/vscode.ts";
import type { SpyglassService } from "@/services/SpyglassService.ts";
import { SpyglassService as SpyglassServiceClass } from "@/services/SpyglassService.ts";
import type { ExtensionMessage, FileFormat, PackStatus, RegistriesPayload, UserSettings, VersionConfig, WebviewMessage } from "@/types.ts";

type PackState =
    | { status: "loading" }
    | { status: "notFound" }
    | { status: "noPackMeta" }
    | { status: "invalid"; reason: string }
    | { status: "ready"; packFormat: number; version: VersionConfig };

interface PendingFile {
    uri: string;
    content: string;
    format: FileFormat;
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
    settings: UserSettings;
}

const DEFAULT_SETTINGS: UserSettings = {
    uiScale: 1,
    colors: {
        primary: "#1b1b1b",
        text: "#dadada",
        add: "#487c13",
        remove: "#9b341b",
        selected: "#7f5505",
        warning: "#cca700",
        error: "#f48771",
        predicate: "#306163",
        function: "#5f5f5f",
        pool: "#386330"
    }
};

const initialState: AppState = {
    packState: { status: "loading" },
    registries: null,
    service: null,
    docAndNode: null,
    virtualUri: null,
    realUri: null,
    loading: false,
    error: null,
    pendingFile: null,
    settings: DEFAULT_SETTINGS
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
    if (uri.endsWith("pack.mcmeta")) return "pack.mcmeta";

    const match = uri.match(/[/\\]((?:data|assets)[/\\].+\.json)$/i);
    if (!match) return null;
    return match[1].replace(/\\/g, "/");
}

function applySettings(settings: UserSettings): void {
    document.documentElement.style.setProperty("--ui-scale", String(settings.uiScale));
    applyColorSettings(settings.colors);
}

function handleInit(pack: PackStatus, settings: UserSettings): void {
    applySettings(settings);
    setState({ settings });

    if (pack.state === "notFound") {
        setState({ packState: { status: "notFound" }, error: null, service: null, registries: null });
        return;
    }

    if (pack.state === "noPackMeta" || pack.state === "invalid") {
        const savedFormat = getManualPackFormat();
        if (savedFormat) {
            postMessage({ type: "changePackFormat", packFormat: savedFormat });
            return;
        }
        if (pack.state === "noPackMeta") {
            setState({ packState: { status: "noPackMeta" }, error: null, service: null, registries: null });
        } else {
            setState({ packState: { status: "invalid", reason: pack.reason }, error: null, service: null, registries: null });
        }
        return;
    }

    setManualPackFormat(undefined);
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

async function handleFile(realUri: string, content: string, format: FileFormat): Promise<void> {
    const { service, virtualUri: oldVirtualUri } = state;

    if (!service) {
        setState({ pendingFile: { uri: realUri, content, format } });
        return;
    }

    await processFile(service, realUri, content, format, oldVirtualUri);
}

async function processFile(service: SpyglassService, realUri: string, content: string, format: FileFormat, oldVirtualUri: string | null): Promise<void> {
    const packPath = extractPackPath(realUri);
    if (!packPath) return;

    const virtualUri = `file:///root/${packPath}`;
    if (oldVirtualUri && oldVirtualUri !== virtualUri) {
        service.unwatchFile(oldVirtualUri, onDocumentUpdated);
    }

    await service.writeFile(virtualUri, content, format);
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

function handleSettings(settings: UserSettings): void {
    applySettings(settings);
    setState({ settings });
}

function handleMessage(event: MessageEvent<ExtensionMessage>): void {
    const msg = event.data;
    switch (msg.type) {
        case "init":
            handleInit(msg.payload.pack, msg.payload.settings);
            break;
        case "settings":
            handleSettings(msg.payload);
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

    const { packState, registries, service, docAndNode, loading, error, settings, virtualUri } = useSyncExternalStore(subscribe, getSnapshot);

    const handleScaleChange = (newScale: number): void => {
        const clamped = Math.max(1, Math.min(20, newScale));
        applySettings({ ...settings, uiScale: clamped });
        setState({ settings: { ...settings, uiScale: clamped } });
        postMessage({ type: "updateSettings", settings: { uiScale: clamped } });
    };

    const getFileContext = (): "data" | "assets" | "none" => {
        if (!virtualUri) return "none";
        if (virtualUri.includes("/data/")) return "data";
        if (virtualUri.includes("/assets/")) return "assets";
        return "none";
    };

    const fileContext = getFileContext();

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

    if (packState.status === "noPackMeta" || packState.status === "invalid") {
        const handleVersionSelect = (packFormat: number): void => {
            setManualPackFormat(packFormat);
            postMessage({ type: "changePackFormat", packFormat } satisfies WebviewMessage);
        };

        const isInvalid = packState.status === "invalid";
        const title = isInvalid ? "Invalid pack.mcmeta" : "No pack.mcmeta found";
        const description = isInvalid ? packState.reason : "Select a Minecraft version to start editing.";

        return (
            <div class="editor-layout">
                <div class="editor-content">
                    <header class="editor-header">
                        <div class="header-row">
                            <VersionSelect packFormat={48} versionId="Select version" onSelect={handleVersionSelect} />
                        </div>
                        <span class="header-separator" />
                    </header>
                    <EmptyState icon={isInvalid ? Octicon.alert : Octicon.file_code} title={title} description={description} />
                </div>
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
                    scale={settings.uiScale}
                    fileContext={fileContext}
                    onPackFormatChange={(newPackFormat) =>
                        postMessage({ type: "changePackFormat", packFormat: newPackFormat } satisfies WebviewMessage)
                    }
                    onScaleChange={handleScaleChange}
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
                <Header
                    packFormat={packFormat}
                    versionId={version.id}
                    scale={settings.uiScale}
                    fileContext={fileContext}
                    onPackFormatChange={handlePackFormatChange}
                    onScaleChange={handleScaleChange}
                />
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
