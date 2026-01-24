import type {
    ConfigurationChangeEvent,
    Disposable,
    ExtensionContext,
    FileSystemWatcher,
    TextDocument,
    TextDocumentChangeEvent,
    TextEditor,
    Webview,
    WebviewView,
    WebviewViewProvider
} from "vscode";
import { Position, Range, RelativePattern, Uri, WorkspaceEdit, window, workspace } from "vscode";
import { CacheService } from "@/services/CacheService.ts";
import { PackDetector } from "@/services/PackDetector.ts";
import { getVersionFromPackFormat } from "@/services/VersionMapper.ts";
import type { ExtensionMessage, MutableRegistries, PackStatus, RegistriesPayload, UserSettings, WebviewMessage } from "@/types.ts";

export class NodeEditorProvider implements WebviewViewProvider {
    static readonly viewType = "minode.nodeEditor";

    private view?: WebviewView;
    private readonly cacheService: CacheService;
    private readonly packDetector: PackDetector;
    private readonly disposables: Disposable[] = [];
    private fileWatcher?: FileSystemWatcher;
    private currentFileUri?: string;
    private currentPackFormat?: number;
    private currentPackRoot?: Uri;
    private isApplyingWebviewEdit = false;

    constructor(private readonly context: ExtensionContext) {
        this.cacheService = new CacheService(context);
        this.packDetector = new PackDetector();
    }

    resolveWebviewView(webviewView: WebviewView): void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.getWebviewDistUri()]
        };

        webviewView.webview.html = this.buildHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(this.handleMessage.bind(this));

        this.registerEditorListeners();
        webviewView.onDidChangeVisibility(() => this.onVisibilityChanged());
        webviewView.onDidDispose(() => this.dispose());
    }

    private onVisibilityChanged(): void {
        if (this.view?.visible && window.activeTextEditor) {
            this.processEditor(window.activeTextEditor);
        }
    }

    private initializeWebview(): void {
        this.sendMessage({ type: "init", payload: { pack: { state: "notFound" }, settings: this.getSettings() } });

        if (window.activeTextEditor) {
            this.processEditor(window.activeTextEditor);
        }
    }

    private toPackStatus(result: import("@/types.ts").PackDetectionResult, hasValidFile: boolean): PackStatus {
        if (result.status === "notFound") {
            return hasValidFile ? { state: "noPackMeta" } : { state: "notFound" };
        }

        if (result.status === "invalid") {
            return { state: "invalid", reason: result.reason };
        }

        const version = getVersionFromPackFormat(result.pack.packFormat);
        if (!version) {
            return { state: "invalid", reason: `Unknown pack format: ${result.pack.packFormat}` };
        }

        return { state: "found", packFormat: result.pack.packFormat, version };
    }

    private async loadRegistries(version: import("@/types.ts").VersionConfig): Promise<void> {
        try {
            const [vanillaRegistries, workspaceRegistries] = await Promise.all([
                this.cacheService.getRegistries(version),
                this.packDetector.scanWorkspaceRegistries(this.currentPackRoot)
            ]);

            const mergedRegistries = this.mergeRegistries(vanillaRegistries, workspaceRegistries);
            this.sendMessage({ type: "registries", payload: mergedRegistries });
        } catch {
            window.showErrorMessage("Mi-Node: Failed to load registries");
        }
    }

    private mergeRegistries(vanilla: Map<string, string[]>, workspace: RegistriesPayload): RegistriesPayload {
        const merged: MutableRegistries = {};
        for (const [category, entries] of vanilla) {
            merged[category] = [...entries];
        }

        for (const [category, entries] of Object.entries(workspace)) {
            if (!merged[category]) {
                merged[category] = [];
            }
            for (const entry of entries) {
                if (!merged[category].includes(entry)) {
                    merged[category].push(entry);
                }
            }
            merged[category].sort();
        }

        return merged;
    }

    focus(): void {
        this.view?.show(true);
    }

    dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

    private registerEditorListeners(): void {
        this.disposables.push(
            window.onDidChangeActiveTextEditor((editor) => this.onActiveEditorChanged(editor)),
            workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e)),
            workspace.onDidChangeConfiguration((e) => this.onConfigurationChanged(e))
        );
    }

    private onConfigurationChanged(event: ConfigurationChangeEvent): void {
        if (event.affectsConfiguration("minode")) {
            this.sendMessage({ type: "settings", payload: this.getSettings() });
        }
    }

    private getSettings(): UserSettings {
        const config = workspace.getConfiguration("minode");
        return {
            uiScale: config.get<number>("uiScale", 1),
            colors: {
                primary: config.get<string>("colors.primary", "#1b1b1b"),
                text: config.get<string>("colors.text", "#dadada"),
                add: config.get<string>("colors.add", "#487c13"),
                remove: config.get<string>("colors.remove", "#9b341b"),
                selected: config.get<string>("colors.selected", "#7f5505"),
                warning: config.get<string>("colors.warning", "#cca700"),
                error: config.get<string>("colors.error", "#f48771"),
                predicate: config.get<string>("colors.predicate", "#306163"),
                function: config.get<string>("colors.function", "#5f5f5f"),
                pool: config.get<string>("colors.pool", "#386330")
            }
        };
    }

    private updateSettings(settings: Partial<UserSettings>): void {
        const config = workspace.getConfiguration("minode");
        if (settings.uiScale !== undefined) {
            config.update("uiScale", settings.uiScale, true);
        }
    }

    private setupFileWatcher(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        const watchRoot = this.currentPackRoot ?? workspace.workspaceFolders?.[0]?.uri;
        if (!watchRoot) return;

        const pattern = new RelativePattern(watchRoot, "{data,assets}/**/*.{json,mcfunction}");
        this.fileWatcher = workspace.createFileSystemWatcher(pattern);

        this.fileWatcher.onDidCreate(() => this.refreshRegistries());
        this.fileWatcher.onDidDelete(() => this.refreshRegistries());

        this.disposables.push(this.fileWatcher);
    }

    private async refreshRegistries(): Promise<void> {
        if (!this.currentPackFormat) return;

        const version = getVersionFromPackFormat(this.currentPackFormat);
        if (!version) return;

        await this.loadRegistries(version);
    }

    private async changePackFormat(packFormat: number): Promise<void> {
        const version = getVersionFromPackFormat(packFormat);
        if (!version) {
            this.sendMessage({ type: "init", payload: { pack: { state: "invalid", reason: `Unknown pack format: ${packFormat}` }, settings: this.getSettings() } });
            return;
        }

        this.currentPackFormat = packFormat;
        this.sendMessage({ type: "init", payload: { pack: { state: "found", packFormat, version }, settings: this.getSettings() } });
        await this.loadRegistries(version);
    }

    private async onActiveEditorChanged(editor: TextEditor | undefined): Promise<void> {
        if (!this.view?.visible) return;
        await this.processEditor(editor);
    }

    private async processEditor(editor: TextEditor | undefined): Promise<void> {
        if (!editor || !this.isEditableFile(editor.document)) {
            this.currentFileUri = undefined;
            return;
        }

        const fileUri = editor.document.uri;
        this.currentFileUri = fileUri.toString();

        await this.detectAndSwitchPack(fileUri);
        this.sendFileContent(editor.document);
    }

    private async detectAndSwitchPack(fileUri: Uri): Promise<void> {
        const result = await this.packDetector.findPackRootFromFile(fileUri);

        if (result.status !== "found") {
            if (!this.currentPackFormat) {
                this.sendMessage({ type: "init", payload: { pack: this.toPackStatus(result, true), settings: this.getSettings() } });
            }
            return;
        }

        const newPackRoot = Uri.joinPath(result.pack.uri, "..");
        const isSamePack = this.currentPackRoot?.fsPath === newPackRoot.fsPath;

        if (isSamePack && this.currentPackFormat === result.pack.packFormat) {
            return;
        }

        const packStatus = this.toPackStatus(result, true);
        if (packStatus.state !== "found") {
            this.sendMessage({ type: "init", payload: { pack: packStatus, settings: this.getSettings() } });
            return;
        }

        this.currentPackRoot = newPackRoot;
        this.currentPackFormat = result.pack.packFormat;
        this.setupFileWatcher();

        this.sendMessage({ type: "init", payload: { pack: packStatus, settings: this.getSettings() } });
        await this.loadRegistries(packStatus.version);
    }

    private onDocumentChanged(event: TextDocumentChangeEvent): void {
        if (this.isApplyingWebviewEdit) return;

        const uri = event.document.uri.toString();
        if (uri !== this.currentFileUri) return;
        if (!this.isEditableFile(event.document)) return;

        this.sendFileContent(event.document);
    }

    private isEditableFile(document: TextDocument): boolean {
        const path = document.uri.fsPath;

        // pack.mcmeta peut avoir languageId "json" ou autre selon la config VS Code
        if (path.endsWith("pack.mcmeta")) return true;

        if (document.languageId !== "json") return false;
        return (path.includes("data") || path.includes("assets")) && path.endsWith(".json");
    }

    private sendFileContent(document: TextDocument): void {
        const options = window.activeTextEditor?.options;
        const eol = document.eol === 1 ? "\n" : "\r\n";
        const tabSize = typeof options?.tabSize === "number" ? options.tabSize : 2;
        const insertSpaces = typeof options?.insertSpaces === "boolean" ? options.insertSpaces : true;

        this.sendMessage({
            type: "file",
            payload: {
                uri: document.uri.toString(),
                content: document.getText(),
                format: { tabSize, insertSpaces, eol }
            }
        });
    }

    private async handleMessage(message: WebviewMessage): Promise<void> {
        switch (message.type) {
            case "ready":
                this.initializeWebview();
                break;
            case "refreshRegistries":
                this.refreshRegistries();
                break;
            case "changePackFormat":
                this.changePackFormat(message.packFormat);
                break;
            case "requestFile":
                await this.handleRequestFile(message.uri);
                break;
            case "saveFile":
                await this.handleSaveFile(message.uri, message.content);
                break;
            case "updateSettings":
                this.updateSettings(message.settings);
                break;
        }
    }

    private async handleRequestFile(uriString: string): Promise<void> {
        try {
            const uri = Uri.parse(uriString);
            const content = await workspace.fs.readFile(uri);
            const text = new TextDecoder().decode(content);
            const eol = text.includes("\r\n") ? "\r\n" : "\n";
            this.sendMessage({
                type: "file",
                payload: {
                    uri: uriString,
                    content: text,
                    format: { tabSize: 2, insertSpaces: true, eol }
                }
            });
        } catch {
            window.showErrorMessage("Mi-Node: Failed to read file");
        }
    }

    private async handleSaveFile(uriString: string, content: string): Promise<void> {
        const uri = Uri.parse(uriString);
        const document = workspace.textDocuments.find((doc) => doc.uri.toString() === uriString);

        if (!document) {
            return;
        }

        const fullRange = new Range(new Position(0, 0), new Position(document.lineCount, 0));

        const edit = new WorkspaceEdit();
        edit.replace(uri, fullRange, content);

        this.isApplyingWebviewEdit = true;
        try {
            await workspace.applyEdit(edit);
        } finally {
            this.isApplyingWebviewEdit = false;
        }
    }

    private sendMessage(message: ExtensionMessage): void {
        this.view?.webview.postMessage(message);
    }

    private getWebviewDistUri(): Uri {
        return Uri.joinPath(this.context.extensionUri, "dist", "webview");
    }

    private buildHtml(webview: Webview): string {
        const scriptUri = webview.asWebviewUri(Uri.joinPath(this.getWebviewDistUri(), "index.js"));
        const styleUri = webview.asWebviewUri(Uri.joinPath(this.getWebviewDistUri(), "index.css"));
        const nonce = this.generateNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https://raw.githubusercontent.com;">
    <link rel="stylesheet" href="${styleUri}">
    <title>Mi-Node</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private generateNonce(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";

        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }
}
