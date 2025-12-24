import * as vscode from "vscode";
import { CacheService } from "@/services/CacheService.ts";
import { getVersionFromPackFormat } from "@/services/VersionMapper.ts";
import type { ExtensionMessage, PackInfo, WebviewMessage } from "@/types.ts";

export class NodeEditorProvider implements vscode.WebviewViewProvider {
    static readonly viewType = "voxelio.nodeEditor";

    private view?: vscode.WebviewView;
    private readonly cacheService: CacheService;
    private readonly disposables: vscode.Disposable[] = [];
    private currentFileUri?: string;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly packInfo: PackInfo
    ) {
        this.cacheService = new CacheService(context);
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
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
        const version = getVersionFromPackFormat(this.packInfo.packFormat);

        if (!version) {
            this.sendMessage({ type: "init", payload: { packFormat: this.packInfo.packFormat, error: "Unknown version" } });
            return;
        }

        this.sendMessage({ type: "init", payload: { packFormat: this.packInfo.packFormat, version } });

        try {
            const registries = await this.cacheService.getRegistries(version);
            this.sendMessage({ type: "registries", payload: Object.fromEntries(registries) });
        } catch (error) {
            console.error("Failed to load registries:", error);
        }
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
            vscode.window.onDidChangeActiveTextEditor((editor) => this.onActiveEditorChanged(editor)),
            vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e))
        );

        if (vscode.window.activeTextEditor) {
            this.onActiveEditorChanged(vscode.window.activeTextEditor);
        }
    }

    private onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
        if (!editor || !this.isDatapackJsonFile(editor.document)) {
            this.currentFileUri = undefined;
            return;
        }

        this.currentFileUri = editor.document.uri.toString();
        this.sendFileContent(editor.document);
    }

    private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
        const uri = event.document.uri.toString();
        if (uri !== this.currentFileUri) return;
        if (!this.isDatapackJsonFile(event.document)) return;

        this.sendFileContent(event.document);
    }

    private isDatapackJsonFile(document: vscode.TextDocument): boolean {
        if (document.languageId !== "json") return false;

        const uri = document.uri.fsPath;
        return uri.includes("data") && uri.endsWith(".json");
    }

    private sendFileContent(document: vscode.TextDocument): void {
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
            const uri = vscode.Uri.parse(uriString);
            const content = await vscode.workspace.fs.readFile(uri);
            const text = new TextDecoder().decode(content);
            this.sendMessage({ type: "file", payload: { uri: uriString, content: text } });
        } catch (error) {
            console.error(`Failed to read file: ${uriString}`, error);
        }
    }

    private async handleSaveFile(uriString: string, content: string): Promise<void> {
        try {
            const uri = vscode.Uri.parse(uriString);
            const encoded = new TextEncoder().encode(content);
            await vscode.workspace.fs.writeFile(uri, encoded);
        } catch (error) {
            console.error(`Failed to save file: ${uriString}`, error);
        }
    }

    private sendMessage(message: ExtensionMessage): void {
        this.view?.webview.postMessage(message);
    }

    private getWebviewDistUri(): vscode.Uri {
        return vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview");
    }

    private buildHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.getWebviewDistUri(), "index.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.getWebviewDistUri(), "index.css"));
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
