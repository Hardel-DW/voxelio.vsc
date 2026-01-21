import type { ExtensionContext } from "vscode";
import { commands, window } from "vscode";
import { NodeEditorProvider } from "@/providers/NodeEditorProvider.ts";

export async function activate(context: ExtensionContext): Promise<void> {
    const provider = new NodeEditorProvider(context);

    context.subscriptions.push(
        window.registerWebviewViewProvider(NodeEditorProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true }
        }),
        commands.registerCommand("minode.openEditor", () => provider.focus()),
        commands.registerCommand("minode.setDatapackRoot", (uri) => provider.setDatapackRoot(uri)),
        commands.registerCommand("minode.browseDatapacks", () => provider.browseDatapacks())
    );
}

export function deactivate(): void {}
