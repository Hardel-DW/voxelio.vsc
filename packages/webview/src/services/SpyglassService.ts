import type { AstNode, DocAndNode, FileNode, LanguageError, MetaRegistry, SymbolRegistrar } from "@spyglassmc/core";
import {
    CheckerContext,
    ConfigService,
    ErrorReporter,
    type ExternalFileSystem,
    type Externals,
    FormatterContext,
    type FsLocation,
    type FsWatcher,
    ProfilerFactory,
    type ProjectInitializer,
    Service,
    VanillaConfig
} from "@spyglassmc/core";
import { BrowserExternals } from "@spyglassmc/core/lib/browser.js";
import type { McmetaStates, McmetaSummary } from "@spyglassmc/java-edition/lib/dependency/index.js";
import { Fluids, ReleaseVersion, symbolRegistrar } from "@spyglassmc/java-edition/lib/dependency/index.js";
import { initialize } from "@spyglassmc/java-edition/lib/json/index.js";
import type { JsonNode } from "@spyglassmc/json";
import { getInitializer } from "@spyglassmc/json";
import { initialize as mcdocInitialize } from "@spyglassmc/mcdoc";
import { attribute, registerAttribute } from "@spyglassmc/mcdoc/lib/runtime/index.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { VanillaMcdocSymbols, VersionMeta } from "@/services/DataFetcher.ts";
import { fetchBlockStates, fetchRegistries, fetchVanillaMcdoc, fetchVersions } from "@/services/DataFetcher.ts";
import type { VersionConfig } from "@/types.ts";

const VANILLA_MCDOC_URI = "mcdoc://vanilla-mcdoc/symbols.json";
const CACHE_URI = "file:///cache/";
const ROOT_URI = "file:///root/";

interface ClientDocument {
    doc: TextDocument;
    undoStack: string[];
    redoStack: string[];
}

export class SpyglassService {
    private readonly documents = new Map<string, ClientDocument>();
    private readonly fileWatchers = new Map<string, Set<(docAndNode: DocAndNode) => void>>();

    private constructor(
        public readonly version: VersionConfig,
        private readonly service: Service,
        private readonly fs: MemoryFileSystem
    ) {
        service.project.on("documentUpdated", (e) => {
            const watchers = this.fileWatchers.get(e.doc.uri);
            if (watchers) {
                for (const handler of watchers) {
                    handler(e);
                }
            }
        });
    }

    getCheckerContext(doc?: TextDocument, errors?: LanguageError[]): CheckerContext {
        const document = doc ?? TextDocument.create("file:///temp.json", "json", 1, "");
        const err = new ErrorReporter();
        if (errors) err.errors = errors;
        return CheckerContext.create(this.service.project, { doc: document, err });
    }

    async openFile(uri: string): Promise<DocAndNode | undefined> {
        const content = await this.readFile(uri);
        if (content === undefined) return undefined;

        const lang = uri.endsWith(".json") ? "json" : "txt";
        await this.service.project.onDidOpen(uri, lang, 1, content);
        const docAndNode = await this.service.project.ensureClientManagedChecked(uri);
        if (!docAndNode) return undefined;

        if (!this.documents.has(uri)) {
            this.documents.set(uri, { doc: docAndNode.doc, undoStack: [], redoStack: [] });
        }
        return docAndNode;
    }

    async readFile(uri: string): Promise<string | undefined> {
        try {
            const buffer = await this.fs.readFile(uri);
            return new TextDecoder().decode(buffer);
        } catch {
            return undefined;
        }
    }

    async writeFile(uri: string, content: string): Promise<void> {
        const document = this.documents.get(uri);
        if (document) {
            document.undoStack.push(document.doc.getText());
            document.redoStack = [];
            TextDocument.update(document.doc, [{ text: content }], document.doc.version + 1);
        }
        await this.fs.writeFile(uri, content);
        if (document) {
            await this.notifyChange(document.doc);
        }
    }

    async applyEdit(uri: string, edit: (node: FileNode<AstNode>) => void): Promise<void> {
        const document = this.documents.get(uri);
        if (!document) return;

        document.undoStack.push(document.doc.getText());
        document.redoStack = [];

        const docAndNode = this.service.project.getClientManaged(uri);
        if (!docAndNode) throw new Error(`Cannot get doc and node: ${uri}`);

        edit(docAndNode.node);
        const newText = this.service.format(docAndNode.node, docAndNode.doc, 2, true);
        TextDocument.update(document.doc, [{ text: newText }], document.doc.version + 1);
        await this.fs.writeFile(uri, document.doc.getText());
        await this.notifyChange(document.doc);
    }

    formatNode(node: JsonNode, uri: string): string {
        const formatter = this.service.project.meta.getFormatter(node.type);
        const doc = TextDocument.create(uri, "json", 1, "");
        const ctx = FormatterContext.create(this.service.project, { doc, tabSize: 2, insertSpaces: true });
        return formatter(node, ctx);
    }

    async undoEdit(uri: string): Promise<void> {
        const document = this.documents.get(uri);
        if (!document) return;

        const lastUndo = document.undoStack.pop();
        if (lastUndo === undefined) return;

        document.redoStack.push(document.doc.getText());
        TextDocument.update(document.doc, [{ text: lastUndo }], document.doc.version + 1);
        await this.fs.writeFile(uri, document.doc.getText());
        await this.notifyChange(document.doc);
    }

    async redoEdit(uri: string): Promise<void> {
        const document = this.documents.get(uri);
        if (!document) return;

        const lastRedo = document.redoStack.pop();
        if (lastRedo === undefined) return;

        document.undoStack.push(document.doc.getText());
        TextDocument.update(document.doc, [{ text: lastRedo }], document.doc.version + 1);
        await this.fs.writeFile(uri, document.doc.getText());
        await this.notifyChange(document.doc);
    }

    watchFile(uri: string, handler: (docAndNode: DocAndNode) => void): void {
        let watchers = this.fileWatchers.get(uri);
        if (!watchers) {
            watchers = new Set();
            this.fileWatchers.set(uri, watchers);
        }
        watchers.add(handler);
    }

    unwatchFile(uri: string, handler: (docAndNode: DocAndNode) => void): void {
        const watchers = this.fileWatchers.get(uri);
        if (watchers) watchers.delete(handler);
    }

    private async notifyChange(doc: TextDocument): Promise<void> {
        const docAndNode = this.service.project.getClientManaged(doc.uri);
        if (docAndNode) {
            await this.service.project.onDidChange(doc.uri, [{ text: doc.getText() }], doc.version + 1);
        } else {
            await this.service.project.onDidOpen(doc.uri, doc.languageId, doc.version, doc.getText());
        }
        await this.service.project.ensureClientManagedChecked(doc.uri);
    }

    static async create(version: VersionConfig): Promise<SpyglassService> {
        const fs = new MemoryFileSystem();
        const externals: Externals = { ...BrowserExternals, fs };

        await fs.mkdir(CACHE_URI);
        await fs.mkdir(ROOT_URI);

        const service = new Service({
            logger: console,
            profilers: new ProfilerFactory(console, []),
            project: {
                cacheRoot: CACHE_URI,
                projectRoots: [ROOT_URI],
                externals,
                defaultConfig: ConfigService.merge(VanillaConfig, {
                    env: {
                        gameVersion: version.ref as ReleaseVersion,
                        dependencies: []
                    }
                }),
                initializers: [mcdocInitialize, createInitializer(version)]
            }
        });

        await service.project.ready();
        return new SpyglassService(version, service, fs);
    }
}

function createInitializer(version: VersionConfig): ProjectInitializer {
    return async (ctx) => {
        const { meta } = ctx;

        const vanillaMcdoc = await fetchVanillaMcdoc();
        meta.registerSymbolRegistrar("vanilla-mcdoc", {
            checksum: vanillaMcdoc.ref,
            registrar: createMcdocRegistrar(vanillaMcdoc)
        });

        const registries = await fetchRegistries(version);
        const blocks = await fetchBlockStates(version);
        const versions = await fetchVersions();

        const summary: McmetaSummary = {
            registries: Object.fromEntries(registries),
            blocks: Object.fromEntries(blocks) as McmetaStates,
            fluids: Fluids,
            commands: { type: "root", children: {} }
        };

        meta.registerSymbolRegistrar("mcmeta-summary", {
            checksum: version.ref,
            registrar: symbolRegistrar(summary, version.ref as ReleaseVersion)
        });

        registerAttributes(meta, version.ref as ReleaseVersion, versions);

        getInitializer()(ctx);
        initialize(ctx);

        return { loadedVersion: version.ref };
    };
}

function createMcdocRegistrar(symbols: VanillaMcdocSymbols): SymbolRegistrar {
    return (registry) => {
        for (const [id, typeDef] of Object.entries(symbols.mcdoc)) {
            registry.query(VANILLA_MCDOC_URI, "mcdoc", id).enter({
                data: { data: { typeDef } },
                usage: { type: "declaration" }
            });
        }

        for (const [dispatcher, ids] of Object.entries(symbols["mcdoc/dispatcher"])) {
            registry
                .query(VANILLA_MCDOC_URI, "mcdoc/dispatcher", dispatcher)
                .enter({ usage: { type: "declaration" } })
                .onEach(Object.entries(ids), ([id, typeDef], query) => {
                    query.member(id, (memberQuery) => {
                        memberQuery.enter({
                            data: { data: { typeDef } },
                            usage: { type: "declaration" }
                        });
                    });
                });
        }
    };
}

interface DirEntry {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
}

function registerAttributes(meta: MetaRegistry, release: ReleaseVersion, versions: VersionMeta[]): void {
    registerAttribute(meta, "since", attribute.validator.string, {
        filterElement: (config) => {
            if (!config.startsWith("1.")) return true;
            return ReleaseVersion.cmp(release, config as ReleaseVersion) >= 0;
        }
    });

    registerAttribute(meta, "until", attribute.validator.string, {
        filterElement: (config) => {
            if (!config.startsWith("1.")) return true;
            return ReleaseVersion.cmp(release, config as ReleaseVersion) < 0;
        }
    });

    registerAttribute(meta, "deprecated", attribute.validator.optional(attribute.validator.string), {
        mapField: (config, field) => {
            if (config === undefined) return { ...field, deprecated: true };
            if (!config.startsWith("1.")) return field;
            if (ReleaseVersion.cmp(release, config as ReleaseVersion) >= 0) {
                return { ...field, deprecated: true };
            }
            return field;
        }
    });

    const maxPackFormat = versions[0]?.data_pack_version ?? 999;
    registerAttribute(meta, "pack_format", () => undefined, {
        checker: (_, typeDef) => {
            if (typeDef.kind !== "literal" || typeof typeDef.value.value !== "number") {
                return undefined;
            }
            const target = typeDef.value.value;
            return (node, ctx) => {
                if (target > maxPackFormat) {
                    ctx.err.report(`Pack format ${target} is higher than max ${maxPackFormat}`, node, 3);
                }
            };
        }
    });
}

type WatcherListener = (...args: never[]) => unknown;

class MemoryFsWatcher implements FsWatcher {
    readonly #listeners = new Map<string, { all: Set<WatcherListener>; once: Set<WatcherListener> }>();

    emit(eventName: string, ...args: unknown[]): boolean {
        const listeners = this.#listeners.get(eventName);
        if (!listeners?.all?.size) return false;

        for (const listener of listeners.all) {
            (listener as (...a: unknown[]) => unknown)(...args);
            if (listeners.once.has(listener)) {
                listeners.all.delete(listener);
                listeners.once.delete(listener);
            }
        }
        return true;
    }

    on(eventName: "ready", listener: () => unknown): this;
    on(eventName: "add", listener: (uri: string) => unknown): this;
    on(eventName: "change", listener: (uri: string) => unknown): this;
    on(eventName: "unlink", listener: (uri: string) => unknown): this;
    on(eventName: "error", listener: (error: Error) => unknown): this;
    on(eventName: string, listener: WatcherListener): this {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, { all: new Set(), once: new Set() });
        }
        this.#listeners.get(eventName)?.all.add(listener);
        return this;
    }

    once(eventName: "ready", listener: () => unknown): this;
    once(eventName: "add", listener: (uri: string) => unknown): this;
    once(eventName: "change", listener: (uri: string) => unknown): this;
    once(eventName: "unlink", listener: (uri: string) => unknown): this;
    once(eventName: "error", listener: (error: Error) => unknown): this;
    once(eventName: string, listener: WatcherListener): this {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, { all: new Set(), once: new Set() });
        }
        const listeners = this.#listeners.get(eventName);
        listeners?.all.add(listener);
        listeners?.once.add(listener);
        return this;
    }

    async close(): Promise<void> { }
}

class MemoryFileSystem implements ExternalFileSystem {
    private readonly files = new Map<string, Uint8Array<ArrayBuffer>>();
    private readonly dirs = new Set<string>();

    async chmod(): Promise<void> { }

    async mkdir(location: FsLocation): Promise<void> {
        this.dirs.add(String(location));
    }

    async readdir(location: FsLocation): Promise<DirEntry[]> {
        const uriStr = String(location);
        const prefix = uriStr.endsWith("/") ? uriStr : `${uriStr}/`;
        const entries: DirEntry[] = [];

        for (const path of this.files.keys()) {
            if (path.startsWith(prefix)) {
                const remaining = path.slice(prefix.length);
                const name = remaining.split("/")[0];
                if (name && !entries.some((e) => e.name === name)) {
                    entries.push({ name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false });
                }
            }
        }
        return entries;
    }

    async readFile(location: FsLocation): Promise<Uint8Array<ArrayBuffer>> {
        const content = this.files.get(String(location));
        if (!content) throw new Error(`File not found: ${location}`);
        return content;
    }

    async showFile(): Promise<void> { }

    async stat(location: FsLocation): Promise<{ isFile(): boolean; isDirectory(): boolean }> {
        const uriStr = String(location);
        if (this.files.has(uriStr)) return { isFile: () => true, isDirectory: () => false };
        if (this.dirs.has(uriStr)) return { isFile: () => false, isDirectory: () => true };
        throw new Error(`Not found: ${location}`);
    }

    async unlink(location: FsLocation): Promise<void> {
        this.files.delete(String(location));
    }

    watch(): FsWatcher {
        const watcher = new MemoryFsWatcher();
        queueMicrotask(() => watcher.emit("ready"));
        return watcher;
    }

    async writeFile(location: FsLocation, data: string | Uint8Array<ArrayBuffer>): Promise<void> {
        const content = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
        this.files.set(String(location), content);
    }
}
