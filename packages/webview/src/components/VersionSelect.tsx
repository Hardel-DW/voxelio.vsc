import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

interface VersionOption {
    packFormat: number;
    versionId: string;
}

type PackType = "datapack" | "resourcepack";

const DATAPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 4, versionId: "1.13" },
    { packFormat: 5, versionId: "1.14" },
    { packFormat: 6, versionId: "1.15" },
    { packFormat: 7, versionId: "1.16" },
    { packFormat: 8, versionId: "1.17" },
    { packFormat: 9, versionId: "1.18" },
    { packFormat: 10, versionId: "1.18.2" },
    { packFormat: 11, versionId: "1.19" },
    { packFormat: 12, versionId: "1.19.3" },
    { packFormat: 13, versionId: "1.19.4" },
    { packFormat: 15, versionId: "1.20" },
    { packFormat: 18, versionId: "1.20.2" },
    { packFormat: 26, versionId: "1.20.3" },
    { packFormat: 41, versionId: "1.20.5" },
    { packFormat: 48, versionId: "1.21" },
    { packFormat: 57, versionId: "1.21.2" },
    { packFormat: 61, versionId: "1.21.4" },
    { packFormat: 71, versionId: "1.21.5" },
    { packFormat: 82, versionId: "1.21.7" },
    { packFormat: 94, versionId: "1.21.11" }
];

const RESOURCEPACK_VERSIONS: readonly VersionOption[] = [
    { packFormat: 1, versionId: "1.6.1" },
    { packFormat: 2, versionId: "1.9" },
    { packFormat: 3, versionId: "1.11" },
    { packFormat: 4, versionId: "1.13" },
    { packFormat: 5, versionId: "1.15" },
    { packFormat: 6, versionId: "1.16.2" },
    { packFormat: 7, versionId: "1.17" },
    { packFormat: 8, versionId: "1.18" },
    { packFormat: 9, versionId: "1.19" },
    { packFormat: 12, versionId: "1.19.3" },
    { packFormat: 13, versionId: "1.19.4" },
    { packFormat: 15, versionId: "1.20" },
    { packFormat: 18, versionId: "1.20.2" },
    { packFormat: 22, versionId: "1.20.3" },
    { packFormat: 32, versionId: "1.20.5" },
    { packFormat: 34, versionId: "1.21" },
    { packFormat: 42, versionId: "1.21.2" },
    { packFormat: 46, versionId: "1.21.4" },
    { packFormat: 55, versionId: "1.21.5" },
    { packFormat: 63, versionId: "1.21.6" },
    { packFormat: 64, versionId: "1.21.7" },
    { packFormat: 65, versionId: "1.21.9" },
    { packFormat: 75, versionId: "1.21.11" }
];

interface VersionSelectProps {
    packFormat: number;
    versionId: string;
    onSelect: (packFormat: number) => void;
}

export function VersionSelect({ packFormat, versionId, onSelect }: VersionSelectProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [packType, setPackType] = useState<PackType>("datapack");
    const [customFormat, setCustomFormat] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const versions = packType === "datapack" ? DATAPACK_VERSIONS : RESOURCEPACK_VERSIONS;

    const handleToggle = (): void => {
        setIsOpen(!isOpen);
    };

    const handleSelect = (newPackFormat: number): void => {
        onSelect(newPackFormat);
        setIsOpen(false);
    };

    const handleBlur = (e: FocusEvent): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    const handlePackTypeChange = (type: PackType): void => {
        setPackType(type);
    };

    const handleCustomFormatChange = (e: Event): void => {
        const target = e.target as HTMLInputElement;
        const filtered = target.value.replace(/[^0-9]/g, "").slice(0, 10);
        setCustomFormat(filtered);
    };

    const handleCustomFormatSubmit = (): void => {
        const parsed = Number.parseInt(customFormat, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
            onSelect(parsed);
            setCustomFormat("");
            setIsOpen(false);
        }
    };

    const handleCustomFormatKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Enter") {
            handleCustomFormatSubmit();
        }
    };

    return (
        <div class="version-select" ref={containerRef} onBlur={handleBlur} role="combobox" aria-expanded={isOpen} tabIndex={0}>
            <button type="button" class="version-select-trigger" onClick={handleToggle}>
                <span class="version-select-title">Minecraft {versionId}</span>
                <span class="version-select-subtitle">Pack Format: {packFormat}</span>
            </button>
            {isOpen && (
                <div class="version-select-dropdown">
                    <div class="version-select-tabs">
                        <button
                            type="button"
                            class={`version-select-tab ${packType === "datapack" ? "active" : ""}`}
                            onClick={() => handlePackTypeChange("datapack")}>
                            Datapack
                        </button>
                        <button
                            type="button"
                            class={`version-select-tab ${packType === "resourcepack" ? "active" : ""}`}
                            onClick={() => handlePackTypeChange("resourcepack")}>
                            Resourcepack
                        </button>
                    </div>
                    <ul class="version-select-list">
                        {versions.toReversed().map((v) => (
                            <li key={v.packFormat}>
                                <button
                                    type="button"
                                    class={`version-select-item ${v.packFormat === packFormat ? "selected" : ""}`}
                                    onClick={() => handleSelect(v.packFormat)}>
                                    <span class="version-select-item-version">{v.versionId}</span>
                                    <span class="version-select-item-format">Format {v.packFormat}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div class="version-select-custom">
                        <input
                            type="text"
                            class="version-select-custom-input"
                            placeholder="Custom format"
                            value={customFormat}
                            onInput={handleCustomFormatChange}
                            onKeyDown={handleCustomFormatKeyDown}
                            inputMode="numeric"
                        />
                        <button type="button" class="version-select-custom-btn" onClick={handleCustomFormatSubmit}>
                            Update
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
