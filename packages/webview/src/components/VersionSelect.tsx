import { getVersionsForPackType, type PackType } from "@voxel/shared/versions";
import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";
import { CustomFormatInput } from "@/components/CustomFormatInput.tsx";

interface VersionSelectProps {
    packFormat: number;
    versionId: string;
    packType?: "Datapack" | "Resourcepack";
    onSelect: (packFormat: number) => void;
}

export function VersionSelect({ packFormat, versionId, packType: initialPackType, onSelect }: VersionSelectProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [packType, setPackType] = useState<PackType>(initialPackType === "Resourcepack" ? "resourcepack" : "datapack");
    const containerRef = useRef<HTMLDivElement>(null);
    const versions = getVersionsForPackType(packType);

    const handleSelect = (newPackFormat: number): void => {
        onSelect(newPackFormat);
        setIsOpen(false);
    };

    const handleBlur = (e: FocusEvent): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <div class="version-select" ref={containerRef} onBlur={handleBlur} role="combobox" aria-expanded={isOpen} tabIndex={0}>
            <button type="button" class="version-select-trigger" onClick={() => setIsOpen(!isOpen)}>
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
                            onClick={() => setPackType("datapack")}>
                            Datapack
                        </button>
                        <button
                            type="button"
                            class={`version-select-tab ${packType === "resourcepack" ? "active" : ""}`}
                            onClick={() => setPackType("resourcepack")}>
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
                                    <span class="version-select-item-version">{v.version.id}</span>
                                    <span class="version-select-item-format">Format {v.packFormat}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <CustomFormatInput onSubmit={handleSelect} buttonText="Update" className="version-select-custom" />
                </div>
            )}
        </div>
    );
}
