import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";
import { type PackType, getVersionsForPackType } from "@/lib/versions.ts";

interface VersionSelectProps {
    packFormat: number;
    versionId: string;
    packType?: "Datapack" | "Resourcepack";
    onSelect: (packFormat: number) => void;
}

export function VersionSelect({ packFormat, versionId, packType: initialPackType, onSelect }: VersionSelectProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [packType, setPackType] = useState<PackType>(initialPackType === "Resourcepack" ? "resourcepack" : "datapack");
    const [customFormat, setCustomFormat] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const versions = getVersionsForPackType(packType);

    const handleToggle = (): void => setIsOpen(!isOpen);
    const handleSelect = (newPackFormat: number): void => {
        onSelect(newPackFormat);
        setIsOpen(false);
    };

    const handleBlur = (e: FocusEvent): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    const handlePackTypeChange = (type: PackType): void => setPackType(type);
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
                <span class="version-select-title">
                    {initialPackType ?? "Minecraft"} {versionId}
                </span>
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
