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
import type { ExtensionMessage, MutableRegistries, PackInfo, RegistriesPayload, WebviewMessage } from "@/types.ts";

export class NodeEditorProvider implements WebviewViewProvider {
    static readonly viewType = "voxelio.nodeEditor";

    private view?: WebviewView;
    private readonly cacheService: CacheService;
    private readonly packDetector: PackDetector;
    private readonly disposables: Disposable[] = [];
    private fileWatcher?: FileSystemWatcher;
    private currentFileUri?: string;
    private currentPackFormat: number;
    private isApplyingWebviewEdit = false;

    constructor(
        private readonly context: ExtensionContext,
        packInfo: PackInfo
    ) {
        this.cacheService = new CacheService(context);
        this.packDetector = new PackDetector();
        this.currentPackFormat = packInfo.packFormat;
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
        webviewView.onDidDispose(() => this.dispose());
    }

    private async initializeWebview(): Promise<void> {
        const version = getVersionFromPackFormat(this.currentPackFormat);

        if (!version) {
            this.sendMessage({ type: "init", payload: { packFormat: this.currentPackFormat, error: "Unknown version" } });
            return;
        }

        this.sendMessage({ type: "init", payload: { packFormat: this.currentPackFormat, version } });

        try {
            const [vanillaRegistries, workspaceRegistries] = await Promise.all([
                this.cacheService.getRegistries(version),
                this.packDetector.scanWorkspaceRegistries()
            ]);

            const mergedRegistries = this.mergeRegistries(vanillaRegistries, workspaceRegistries);
            this.sendMessage({ type: "registries", payload: mergedRegistries });
        } catch {
            window.showErrorMessage("Voxelio: Failed to load registries");
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
        this.setupFileWatcher();
        this.disposables.push(
            window.onDidChangeActiveTextEditor((editor) => this.onActiveEditorChanged(editor)),
            workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e))
        );

        if (window.activeTextEditor) {
            this.onActiveEditorChanged(window.activeTextEditor);
        }
    }

    private setupFileWatcher(): void {
        const workspaceFolder = workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const pattern = new RelativePattern(workspaceFolder, "data/**/*.{json,mcfunction}");
        this.fileWatcher = workspace.createFileSystemWatcher(pattern);

        this.fileWatcher.onDidCreate(() => this.refreshRegistries());
        this.fileWatcher.onDidDelete(() => this.refreshRegistries());

        this.disposables.push(this.fileWatcher);
    }

    private async refreshRegistries(): Promise<void> {
        const version = getVersionFromPackFormat(this.currentPackFormat);
        if (!version) return;

        const [vanillaRegistries, workspaceRegistries] = await Promise.all([
            this.cacheService.getRegistries(version),
            this.packDetector.scanWorkspaceRegistries()
        ]);

        this.sendMessage({ type: "registries", payload: this.mergeRegistries(vanillaRegistries, workspaceRegistries) });
    }

    private async changePackFormat(packFormat: number): Promise<void> {
        this.currentPackFormat = packFormat;
        this.initializeWebview();
    }

    private onActiveEditorChanged(editor: TextEditor | undefined): void {
        if (!editor || !this.isDatapackJsonFile(editor.document)) {
            this.currentFileUri = undefined;
            return;
        }

        this.currentFileUri = editor.document.uri.toString();
        this.sendFileContent(editor.document);
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
            window.showErrorMessage("Voxelio: Failed to read file");
        }
    }

    private async handleSaveFile(uriString: string, content: string): Promise<void> {
        const uri = Uri.parse(uriString);
        const document = workspace.textDocuments.find((doc) => doc.uri.toString() === uriString);

        if (!document) {
            return;
        }

        const fullRange = new Range(
            new Position(0, 0),
            new Position(document.lineCount, 0)
        );

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
    <title>Voxelio</title>
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
