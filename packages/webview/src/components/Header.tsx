import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { Octicon } from "@/components/Icons.tsx";
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { postMessage } from "@/lib/vscode.ts";

type FileContext = "data" | "assets" | "none";

interface HeaderProps {
    packFormat: number;
    versionId: string;
    fileContext: FileContext;
    onPackFormatChange: (packFormat: number) => void;
}

export function Header({ packFormat, versionId, fileContext, onPackFormatChange }: HeaderProps): JSX.Element {
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = (): void => {
        if (isReloading) return;
        setIsReloading(true);
        postMessage({ type: "refreshRegistries" });
        setTimeout(() => setIsReloading(false), 2000);
    };

    const renderTitle = (): JSX.Element => {
        if (fileContext === "none") {
            return (
                <div class="header-info">
                    <span class="header-title">Welcome to Mi-Node</span>
                </div>
            );
        }
        const packType = fileContext === "data" ? "Datapack" : "Resourcepack";
        return <VersionSelect packFormat={packFormat} versionId={versionId} packType={packType} onSelect={onPackFormatChange} />;
    };

    return (
        <header class="editor-header">
            <div class="header-row">
                {renderTitle()}
                <div class="header-actions">
                    <button
                        type="button"
                        class={`header-icon ${isReloading ? "rotating" : ""}`}
                        onClick={handleReload}
                        title="Reload registries">
                        {Octicon.reload}
                    </button>
                </div>
            </div>
            <span class="header-separator" />
        </header>
    );
}
