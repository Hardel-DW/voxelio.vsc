import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { Octicon } from "@/components/Icons.tsx";
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { applyUiScale, getUiScale, MAX_SCALE, MIN_SCALE, postMessage, setUiScale } from "@/lib/vscode.ts";

interface HeaderProps {
    packFormat: number;
    versionId: string;
    onPackFormatChange: (packFormat: number) => void;
}

export function Header({ packFormat, versionId, onPackFormatChange }: HeaderProps): JSX.Element {
    const [scale, setScaleState] = useState<number>(() => {
        const saved = getUiScale();
        applyUiScale(saved);
        return saved;
    });
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = (): void => {
        if (isReloading) return;
        setIsReloading(true);
        postMessage({ type: "refreshRegistries" });
        setTimeout(() => setIsReloading(false), 2000);
    };

    const handleScaleChange = (e: JSX.TargetedEvent<HTMLInputElement>): void => {
        const value = Number(e.currentTarget.value);
        setScaleState(value);
        setUiScale(value);
    };

    return (
        <header class="editor-header">
            <div class="header-row">
                <VersionSelect packFormat={packFormat} versionId={versionId} onSelect={onPackFormatChange} />
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
