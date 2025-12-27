import type { ExtensionContext } from "vscode";
import { window, commands } from "vscode";
import { NodeEditorProvider } from "@/providers/NodeEditorProvider.ts";
import { PackDetector } from "@/services/PackDetector.ts";

export async function activate(context: ExtensionContext): Promise<void> {
    const packDetector = new PackDetector();
    const packInfo = await packDetector.detect();
    if (!packInfo) {
        return;
    }

    const provider = new NodeEditorProvider(context, packInfo);
    context.subscriptions.push(
        window.registerWebviewViewProvider(NodeEditorProvider.viewType, provider, {
            webviewOptions: { retainContextWhenHidden: true }
        }),
        commands.registerCommand("voxelio.openEditor", () => provider.focus())
    );
}

export function deactivate(): void { }
