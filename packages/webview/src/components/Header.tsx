import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { Octicon } from "@/components/Icons.tsx";
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { MAX_SCALE, MIN_SCALE, postMessage } from "@/lib/vscode.ts";

type FileContext = "data" | "assets" | "none";

interface HeaderProps {
    packFormat: number;
    versionId: string;
    scale: number;
    fileContext: FileContext;
    onPackFormatChange: (packFormat: number) => void;
    onScaleChange: (scale: number) => void;
}

export function Header({ packFormat, versionId, scale, fileContext, onPackFormatChange, onScaleChange }: HeaderProps): JSX.Element {
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = (): void => {
        if (isReloading) return;
        setIsReloading(true);
        postMessage({ type: "refreshRegistries" });
        setTimeout(() => setIsReloading(false), 2000);
    };

    const handleScaleChange = (e: JSX.TargetedEvent<HTMLInputElement>): void => {
        const value = Number(e.currentTarget.value);
        onScaleChange(value);
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
                    <label class="header-scale-slider">
                        <span class="header-scale-label">Size: {scale}</span>
                        <input
                            type="range"
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            value={scale}
                            onInput={handleScaleChange}
                            class="header-scale-input"
                        />
                    </label>
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
