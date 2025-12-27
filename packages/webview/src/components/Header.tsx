import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import { postMessage } from "@/lib/vscode.ts";

interface HeaderProps {
    packFormat: number;
    versionId: string;
}

export function Header({ packFormat, versionId }: HeaderProps): JSX.Element {
    const handleReload = (): void => {
        postMessage({ type: "refreshRegistries" });
    };

    return (
        <header class="editor-header">
            <div class="header-row">
                <div class="header-info">
                    <span class="header-title">Minecraft {versionId}</span>
                    <span class="header-subtitle">Pack Format: {packFormat}</span>
                </div>
                <button type="button" class="header-reload" onClick={handleReload} title="Reload registries">
                    {Octicon.reload}
                </button>
            </div>
            <span class="header-separator" />
        </header>
    );
}
