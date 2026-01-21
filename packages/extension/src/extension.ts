import type { ExtensionContext } from "vscode";
import { commands, window } from "vscode";
import { NodeEditorProvider } from "@/providers/NodeEditorProvider.ts";

export function activate(context: ExtensionContext): void {
    const provider = new NodeEditorProvider(context);

    context.subscriptions.push(
        window.registerWebviewViewProvider(NodeEditorProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true }
        }),
        commands.registerCommand("minode.openEditor", () => provider.focus())
    );
}

export function deactivate(): void {}
