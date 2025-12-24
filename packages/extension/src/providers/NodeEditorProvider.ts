import * as vscode from "vscode";
import type { ExtensionMessage, PackInfo, WebviewMessage } from "@/types.ts";

export class NodeEditorProvider implements vscode.WebviewViewProvider {
    static readonly viewType = "voxelio.nodeEditor";

    private view?: vscode.WebviewView;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly packInfo: PackInfo
    ) { }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.getWebviewDistUri()]
        };

        webviewView.webview.html = this.buildHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(this.handleMessage.bind(this));

        this.sendMessage({ type: "init", payload: { packFormat: this.packInfo.packFormat } });
    }

    focus(): void {
        this.view?.show(true);
    }

    private handleMessage(message: WebviewMessage): void {
        switch (message.type) {
            case "ready":
                this.sendMessage({ type: "init", payload: { packFormat: this.packInfo.packFormat } });
                break;
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link rel="stylesheet" href="${styleUri}">
    <title>Voxelio</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
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
