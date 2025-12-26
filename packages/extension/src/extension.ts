import * as vscode from "vscode";
import { NodeEditorProvider } from "@/providers/NodeEditorProvider.ts";
import { PackDetector } from "@/services/PackDetector.ts";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const packDetector = new PackDetector();
    const packInfo = await packDetector.detect();
    if (!packInfo) {
        return;
    }

    const provider = new NodeEditorProvider(context, packInfo);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(NodeEditorProvider.viewType, provider),
        vscode.commands.registerCommand("voxelio.openEditor", () => provider.focus())
    );
}

export function deactivate(): void {}
