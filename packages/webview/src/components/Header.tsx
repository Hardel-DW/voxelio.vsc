import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { Octicon } from "@/components/Icons.tsx";
import { VersionSelect } from "@/components/VersionSelect.tsx";
import { applyUiScale, cycleUiScale, getUiScale, postMessage, type UiScale } from "@/lib/vscode.ts";

const SCALE_LABELS: Record<UiScale, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large"
};

interface HeaderProps {
    packFormat: number;
    versionId: string;
    onPackFormatChange: (packFormat: number) => void;
}

export function Header({ packFormat, versionId, onPackFormatChange }: HeaderProps): JSX.Element {
    const [scale, setScale] = useState<UiScale>(() => {
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

    const handleScaleToggle = (): void => {
        const next = cycleUiScale();
        setScale(next);
    };

    return (
        <header class="editor-header">
            <div class="header-row">
                <VersionSelect packFormat={packFormat} versionId={versionId} onSelect={onPackFormatChange} />
                <div class="header-actions">
                    <button type="button" class="header-scale" onClick={handleScaleToggle}>
                        Text Size: {SCALE_LABELS[scale]}
                    </button>
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
