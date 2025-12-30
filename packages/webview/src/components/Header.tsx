import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { postMessage } from "@/lib/vscode.ts";

interface HeaderProps {
    packFormat: number;
    versionId: string;
    onPackFormatChange: (packFormat: number) => void;
}

export function Header({ packFormat, versionId, onPackFormatChange }: HeaderProps): JSX.Element {
    const handleReload = (): void => {
        postMessage({ type: "refreshRegistries" });
    };

    return (
        <header class="editor-header">
            <div class="header-row">
                <VersionSelect packFormat={packFormat} versionId={versionId} onSelect={onPackFormatChange} />
                <button type="button" class="header-reload" onClick={handleReload} title="Reload registries">
                    {Octicon.reload}
                </button>
            </div>
            <span class="header-separator" />
        </header>
    );
}
