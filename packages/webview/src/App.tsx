import type { DocAndNode } from "@spyglassmc/core";
import { dissectUri } from "@spyglassmc/java-edition/lib/binder/index.js";
import { DEFAULT_SETTINGS } from "@voxel/shared/constants";
import type {
    ExtensionMessage,
    FileFormat,
    McdocFilesPayload,
    PackStatus,
    RegistriesPayload,
    SpyglassConfig,
    UserSettings,
    VersionConfig,
    WebviewMessage
} from "@voxel/shared/types";
import type { JSX } from "preact";
import { useSyncExternalStore } from "preact/compat";
import { useState } from "preact/hooks";
import { EmptyState } from "@/components/EmptyState.tsx";
import { Footer } from "@/components/Footer.tsx";
import { Header } from "@/components/Header.tsx";
import { Octicon } from "@/components/Icons.tsx";
import { JsonFileView } from "@/components/JsonFileView.tsx";
import { PackFormatPicker } from "@/components/PackFormatPicker.tsx";
import { WikiLink } from "@/components/WikiLink.tsx";
import { getWikiLabel, getWikiUrl } from "@/config.ts";
import { applyColorSettings } from "@/lib/colors.ts";
import { getManualPackFormat, getPersistedState, postMessage, setManualPackFormat, setPersistedState } from "@/lib/vscode.ts";
import type { SpyglassService } from "@/services/SpyglassService.ts";
import { SpyglassService as SpyglassServiceClass } from "@/services/SpyglassService.ts";

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

interface UnsupportedFile {
    uri: string;
    reason: string;
}

interface AppState {
    packState: PackState;
    registries: RegistriesPayload | null;
    mcdocFiles: McdocFilesPayload | null;
    spyglassConfig: SpyglassConfig | null;
    service: SpyglassService | null;
    docAndNode: DocAndNode | null;
    virtualUri: string | null;
    realUri: string | null;
    loading: boolean;
    error: string | null;
    pendingFile: PendingFile | null;
    settings: UserSettings;
    unsupportedFile: UnsupportedFile | null;
}

const initialState: AppState = {
    packState: { status: "loading" },
    registries: null,
    mcdocFiles: null,
    spyglassConfig: null,
    service: null,
    docAndNode: null,
    virtualUri: null,
    realUri: null,
    loading: false,
    error: null,
    pendingFile: null,
    settings: DEFAULT_SETTINGS,
    unsupportedFile: null
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
            return;
        }

        setState({ packState: { status: "invalid", reason: pack.reason }, error: null, service: null, registries: null });
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
    const { service, packState, virtualUri, realUri, mcdocFiles, spyglassConfig } = state;
    setState({ registries });
    const version = packState.status === "ready" ? packState.version : null;

    if (!service || !version) {
        tryCreateService();
        return;
    }

    if (virtualUri) service.unwatchFile(virtualUri, onDocumentUpdated);
    const customResources = spyglassConfig?.env?.customResources;
    const newService = await SpyglassServiceClass.create(version, registries, customResources);

    if (mcdocFiles?.files.length) {
        await newService.loadMcdocFiles(mcdocFiles.files);
    }

    setState({ service: newService, docAndNode: null });
    if (realUri) {
        postMessage({ type: "requestFile", uri: realUri });
    }
}

async function tryCreateService(): Promise<void> {
    const { packState, registries, service, loading } = state;
    if (packState.status !== "ready" || !registries || service || loading) {
        return;
    }

    setState({ loading: true });
    try {
        const { spyglassConfig } = state;
        const customResources = spyglassConfig?.env?.customResources;
        const newService = await SpyglassServiceClass.create(packState.version, registries, customResources);
        const { mcdocFiles } = state;
        if (mcdocFiles?.files.length) {
            await newService.loadMcdocFiles(mcdocFiles.files);
        }

        setState({ service: newService, loading: false });

        const { pendingFile, virtualUri } = state;
        if (pendingFile) {
            await processFile(newService, pendingFile.uri, pendingFile.content, pendingFile.format, virtualUri);
        }
    } catch (err) {
        setState({ error: err instanceof Error ? err.message : "Failed to init", loading: false });
    }
}

async function handleFile(realUri: string, content: string, format: FileFormat): Promise<void> {
    const { service, virtualUri: oldVirtualUri } = state;

    if (!service) {
        setState({ pendingFile: { uri: realUri, content, format }, unsupportedFile: null });
        return;
    }

    setState({ unsupportedFile: null });
    await processFile(service, realUri, content, format, oldVirtualUri);
}

function handleUnsupportedFile(uri: string, reason: string): void {
    setState({ unsupportedFile: { uri, reason }, docAndNode: null });
}

async function processFile(
    service: SpyglassService,
    realUri: string,
    content: string,
    format: FileFormat,
    oldVirtualUri: string | null
): Promise<void> {
    const packPath = extractPackPath(realUri);
    if (!packPath) return;

    const virtualUri = `file:///root/${packPath}`;
    const isSameFile = oldVirtualUri === virtualUri;

    if (oldVirtualUri && !isSameFile) {
        service.unwatchFile(oldVirtualUri, onDocumentUpdated);
    }

    if (isSameFile) {
        service.unwatchFile(virtualUri, onDocumentUpdated);
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

async function handleMcdocFiles(payload: McdocFilesPayload): Promise<void> {
    setState({ mcdocFiles: payload });

    const { service } = state;
    if (!service) return;

    await service.loadMcdocFiles(payload.files);
}

function handleSpyglassConfig(config: SpyglassConfig): void {
    setState({ spyglassConfig: config });
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
            handleFile(msg.payload.uri, msg.payload.content, msg.payload.format);
            break;
        case "unsupportedFile":
            handleUnsupportedFile(msg.payload.uri, msg.payload.reason);
            break;
        case "mcdocFiles":
            handleMcdocFiles(msg.payload);
            break;
        case "spyglassConfig":
            handleSpyglassConfig(msg.payload);
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

    const { packState, registries, service, docAndNode, loading, error, settings, virtualUri, unsupportedFile } = useSyncExternalStore(
        subscribe,
        getSnapshot
    );

    const getFileContext = (): "data" | "assets" | "none" => {
        if (!virtualUri) return "none";
        if (virtualUri.includes("/data/")) return "data";
        if (virtualUri.includes("/assets/")) return "assets";
        return "none";
    };

    const fileContext = getFileContext();

    if (unsupportedFile) {
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.alert} title="Unsupported file" description={unsupportedFile.reason} />
                <Footer />
            </div>
        );
    }

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
                    <EmptyState icon={isInvalid ? Octicon.alert : Octicon.file_code} title={title} description={description}>
                        <PackFormatPicker onSelect={handleVersionSelect} />
                    </EmptyState>
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
                    fileContext={fileContext}
                    onPackFormatChange={(newPackFormat) =>
                        postMessage({ type: "changePackFormat", packFormat: newPackFormat } satisfies WebviewMessage)
                    }
                />
                <EmptyState icon={Octicon.alert} title="Error" description={error} />
                <Footer />
            </div>
        );
    }

    if (loading || !registries || !service) {
        const title = loading ? "Loading Spyglass..." : !registries ? "Loading registries..." : "Initializing Spyglass...";
        return (
            <div class="editor-layout">
                <EmptyState icon={Octicon.loader} title={title} />
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
                    fileContext={fileContext}
                    onPackFormatChange={handlePackFormatChange}
                />
                {docAndNode ? (
                    <>
                        <JsonFileView docAndNode={docAndNode} service={service} largeFileThreshold={settings.largeFileThreshold} />
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
