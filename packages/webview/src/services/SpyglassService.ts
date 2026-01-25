import type {
    AstNode,
    DecompressedFile,
    DocAndNode,
    Externals,
    FileNode,
    LanguageError,
    MetaRegistry,
    ProjectInitializer,
    SymbolRegistrar
} from "@spyglassmc/core";
import { CheckerContext, ConfigService, ErrorReporter, FormatterContext, ProfilerFactory, Service, VanillaConfig } from "@spyglassmc/core";
import { BrowserExternals } from "@spyglassmc/core/lib/browser.js";
import { registerCustomResources, uriBinder } from "@spyglassmc/java-edition/lib/binder/index.js";
import type { McmetaStates, McmetaSummary } from "@spyglassmc/java-edition/lib/dependency/index.js";
import { Fluids, ReleaseVersion, symbolRegistrar } from "@spyglassmc/java-edition/lib/dependency/index.js";
import { initialize } from "@spyglassmc/java-edition/lib/json/index.js";
import type { JsonNode } from "@spyglassmc/json";
import { getInitializer } from "@spyglassmc/json";
import { initialize as mcdocInitialize } from "@spyglassmc/mcdoc";
import { attribute, registerAttribute } from "@spyglassmc/mcdoc/lib/runtime/index.js";
import type { FileFormat, McdocFile, VanillaMcdocSymbols, VersionConfig, VersionMeta } from "@voxel/shared/types";
import { extractZip, makeZip } from "@voxelio/zip";
import { TextDocument } from "vscode-languageserver-textdocument";
import { fetchBlockStates, fetchRegistries, fetchVanillaMcdoc, fetchVersions } from "@/services/DataFetcher.ts";
import { MemoryFileSystem } from "./MemoryFileSystem.ts";

const VANILLA_MCDOC_URI = "mcdoc://vanilla-mcdoc/symbols.json";
const CACHE_URI = "file:///cache/";
const ROOT_URI = "file:///root/";

interface ClientDocument {
    doc: TextDocument;
    format: FileFormat;
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

        const lang = uri.endsWith(".json") || uri.endsWith(".mcmeta") ? "json" : "txt";
        await this.service.project.onDidOpen(uri, lang, 1, content);
        const docAndNode = await this.service.project.ensureClientManagedChecked(uri);
        if (!docAndNode) return undefined;

        const existing = this.documents.get(uri);
        if (existing) {
            existing.doc = docAndNode.doc;
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

    async writeFile(uri: string, content: string, format?: FileFormat): Promise<void> {
        const document = this.documents.get(uri);
        if (document) {
            TextDocument.update(document.doc, [{ text: content }], document.doc.version + 1);
            if (format) {
                document.format = format;
            }
        } else if (format) {
            const doc = TextDocument.create(uri, "json", 1, content);
            this.documents.set(uri, { doc, format, undoStack: [], redoStack: [] });
        }
        await this.fs.writeFile(uri, content);
        await this.parseWithoutNotify(uri, content);
    }

    private async parseWithoutNotify(uri: string, content: string): Promise<void> {
        const docAndNode = this.service.project.getClientManaged(uri);
        if (docAndNode) {
            await this.service.project.onDidChange(uri, [{ text: content }], docAndNode.doc.version + 1);
        } else {
            await this.service.project.onDidOpen(uri, "json", 1, content);
        }
        await this.service.project.ensureClientManagedChecked(uri);
    }

    async applyEdit(uri: string, edit: (node: FileNode<AstNode>) => void): Promise<void> {
        const document = this.documents.get(uri);
        if (!document) return;

        document.undoStack.push(document.doc.getText());
        document.redoStack = [];

        const docAndNode = this.service.project.getClientManaged(uri);
        if (!docAndNode) throw new Error(`Cannot get doc and node: ${uri}`);

        edit(docAndNode.node);

        const { tabSize, insertSpaces, eol } = document.format;
        let newText = this.service.format(docAndNode.node, docAndNode.doc, tabSize, insertSpaces);
        if (eol === "\r\n") newText = newText.replace(/\n/g, "\r\n");

        TextDocument.update(document.doc, [{ text: newText }], document.doc.version + 1);
        await this.fs.writeFile(uri, document.doc.getText());
        await this.notifyChange(document.doc);
    }

    formatNode(node: JsonNode, uri: string): string {
        const document = this.documents.get(uri);
        if (!document) throw new Error(`Document not found: ${uri}`);
        const { tabSize, insertSpaces } = document.format;

        const formatter = this.service.project.meta.getFormatter(node.type);
        const doc = TextDocument.create(uri, "json", 1, "");
        const ctx = FormatterContext.create(this.service.project, { doc, tabSize, insertSpaces });
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

    static async create(
        version: VersionConfig,
        customRegistries?: Record<string, string[]>,
        customResources?: Record<string, { category: string; pack?: string }>,
        mcdocFiles?: readonly McdocFile[]
    ): Promise<SpyglassService> {
        const fs = new MemoryFileSystem();
        const externals: Externals = {
            ...BrowserExternals,
            fs,
            archive: {
                ...BrowserExternals.archive,
                decompressBall
            }
        };

        await fs.mkdir(CACHE_URI);
        await fs.mkdir(ROOT_URI);
        const hasCustomMcdoc = mcdocFiles && mcdocFiles.length > 0;
        const dependencies = hasCustomMcdoc ? ["@custom-mcdoc"] : [];

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
                        dependencies,
                        customResources: customResources ?? {}
                    }
                }),
                initializers: [mcdocInitialize, createInitializer(version, customRegistries, mcdocFiles, fs)]
            }
        });

        await service.project.ready();
        return new SpyglassService(version, service, fs);
    }
}

function createInitializer(
    version: VersionConfig,
    customRegistries?: Record<string, string[]>,
    mcdocFiles?: readonly McdocFile[],
    fs?: MemoryFileSystem
): ProjectInitializer {
    return async (ctx) => {
        const { meta, cacheRoot } = ctx;

        const vanillaMcdoc = await fetchVanillaMcdoc();
        meta.registerSymbolRegistrar("vanilla-mcdoc", {
            checksum: vanillaMcdoc.ref,
            registrar: createMcdocRegistrar(vanillaMcdoc)
        });

        if (mcdocFiles && mcdocFiles.length > 0 && fs) {
            meta.registerDependencyProvider("@custom-mcdoc", async () => {
                const uri = `${cacheRoot}downloads/custom-mcdoc.tar.gz`;
                const buffer = await compressMcdocFiles(mcdocFiles);
                await fs.writeFile(uri, buffer);
                return { type: "tarball-file", uri };
            });
        }

        const vanillaRegistries = await fetchRegistries(version);
        const blocks = await fetchBlockStates(version);
        const versions = await fetchVersions();
        const mergedRegistries = mergeRegistries(vanillaRegistries, customRegistries);
        const summary: McmetaSummary = {
            registries: Object.fromEntries(mergedRegistries),
            blocks: Object.fromEntries(blocks) as McmetaStates,
            fluids: Fluids,
            commands: { type: "root", children: {} }
        };

        meta.registerSymbolRegistrar("mcmeta-summary", {
            checksum: version.ref,
            registrar: symbolRegistrar(summary, version.ref as ReleaseVersion)
        });

        registerAttributes(meta, version.ref as ReleaseVersion, versions);

        meta.registerUriBinder(uriBinder);

        registerCustomResources(ctx.config);
        getInitializer()(ctx);
        initialize(ctx);

        return { loadedVersion: version.ref };
    };
}

async function decompressBall(buffer: Uint8Array<ArrayBuffer>, options?: { stripLevel?: number }): Promise<DecompressedFile[]> {
    const extracted = await extractZip(buffer);
    return Object.entries(extracted).map(([filename, data]) => {
        const path = options?.stripLevel === 1 ? filename.substring(filename.indexOf("/") + 1) : filename;
        return {
            data: data as Uint8Array<ArrayBuffer>,
            path,
            mtime: "",
            type: "file" as const,
            mode: 0
        };
    });
}

async function compressMcdocFiles(files: readonly McdocFile[]): Promise<Uint8Array<ArrayBuffer>> {
    const zipInputs = files.map((file) => {
        const match = file.uri.match(/[/\\]([^/\\]+\.mcdoc)$/i);
        const filename = match?.[1] ?? "custom.mcdoc";
        return { input: new TextEncoder().encode(file.content), name: filename };
    });

    const response = makeZip(zipInputs);
    const reader = response.getReader();
    const chunks: Uint8Array[] = [];

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result as Uint8Array<ArrayBuffer>;
}

function mergeRegistries(vanilla: Map<string, string[]>, custom?: Record<string, string[]>): Map<string, string[]> {
    if (!custom) return vanilla;

    const merged = new Map(vanilla);

    for (const [category, entries] of Object.entries(custom)) {
        const existing = merged.get(category) ?? [];
        const combined = [...existing];

        for (const entry of entries) {
            if (!combined.includes(entry)) {
                combined.push(entry);
            }
        }

        merged.set(category, combined.sort());
    }

    return merged;
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
