import type {
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
import type { ExtensionMessage, MutableRegistries, PackStatus, RegistriesPayload, WebviewMessage } from "@/types.ts";

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
        this.sendMessage({ type: "init", payload: { pack: { state: "notFound" } } });

        if (window.activeTextEditor) {
            this.processEditor(window.activeTextEditor);
        }
    }

    private toPackStatus(result: import("@/types.ts").PackDetectionResult): PackStatus {
        if (result.status === "notFound") {
            return { state: "notFound" };
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
            workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e))
        );
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
            this.sendMessage({ type: "init", payload: { pack: { state: "invalid", reason: `Unknown pack format: ${packFormat}` } } });
            return;
        }

        this.currentPackFormat = packFormat;
        this.sendMessage({ type: "init", payload: { pack: { state: "found", packFormat, version } } });
        await this.loadRegistries(version);
    }

    private async onActiveEditorChanged(editor: TextEditor | undefined): Promise<void> {
        if (!this.view?.visible) return;
        await this.processEditor(editor);
    }

    private async processEditor(editor: TextEditor | undefined): Promise<void> {
        if (!editor || !this.isDatapackJsonFile(editor.document)) {
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
            this.sendMessage({ type: "init", payload: { pack: this.toPackStatus(result) } });
            return;
        }

        const newPackRoot = Uri.joinPath(result.pack.uri, "..");
        const isSamePack = this.currentPackRoot?.fsPath === newPackRoot.fsPath;

        if (isSamePack && this.currentPackFormat === result.pack.packFormat) {
            return;
        }

        const packStatus = this.toPackStatus(result);
        if (packStatus.state !== "found") {
            this.sendMessage({ type: "init", payload: { pack: packStatus } });
            return;
        }

        this.currentPackRoot = newPackRoot;
        this.currentPackFormat = result.pack.packFormat;
        this.setupFileWatcher();

        this.sendMessage({ type: "init", payload: { pack: packStatus } });
        await this.loadRegistries(packStatus.version);
    }

    private onDocumentChanged(event: TextDocumentChangeEvent): void {
        if (this.isApplyingWebviewEdit) return;

        const uri = event.document.uri.toString();
        if (uri !== this.currentFileUri) return;
        if (!this.isDatapackJsonFile(event.document)) return;

        this.sendFileContent(event.document);
    }

    private isDatapackJsonFile(document: TextDocument): boolean {
        if (document.languageId !== "json") return false;

        const path = document.uri.fsPath;
        return (path.includes("data") || path.includes("assets")) && path.endsWith(".json");
    }

    private sendFileContent(document: TextDocument): void {
        this.sendMessage({
            type: "file",
            payload: { uri: document.uri.toString(), content: document.getText() }
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
        }
    }

    private async handleRequestFile(uriString: string): Promise<void> {
        try {
            const uri = Uri.parse(uriString);
            const content = await workspace.fs.readFile(uri);
            const text = new TextDecoder().decode(content);
            this.sendMessage({ type: "file", payload: { uri: uriString, content: text } });
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
