import { getVersionsForPackType, type PackType } from "@voxel/shared/versions";
import { useRef, useState } from "preact/hooks";

export function PackFormatPicker(props: { onSelect: (packFormat: number) => void }) {
    const { onSelect } = props;
    const [packType, setPackType] = useState<PackType>("datapack");
    const [customFormat, setCustomFormat] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const versions = getVersionsForPackType(packType);

    const handleSelect = (packFormat: number): void => onSelect(packFormat);
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
        }
    };

    const handleCustomFormatKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Enter") {
            handleCustomFormatSubmit();
        }
    };

    return (
        <div class="pack-format-picker" ref={containerRef}>
            <div class="pack-format-picker-tabs">
                <button
                    type="button"
                    class={`pack-format-picker-tab ${packType === "datapack" ? "active" : ""}`}
                    onClick={() => handlePackTypeChange("datapack")}>
                    Datapack
                </button>
                <button
                    type="button"
                    class={`pack-format-picker-tab ${packType === "resourcepack" ? "active" : ""}`}
                    onClick={() => handlePackTypeChange("resourcepack")}>
                    Resourcepack
                </button>
            </div>
            <ul class="pack-format-picker-list">
                {versions.toReversed().map((v) => (
                    <li key={v.packFormat}>
                        <button type="button" class="pack-format-picker-item" onClick={() => handleSelect(v.packFormat)}>
                            <span class="pack-format-picker-item-version">{v.version.id}</span>
                            <span class="pack-format-picker-item-format">Format {v.packFormat}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div class="pack-format-picker-custom">
                <input
                    type="text"
                    class="pack-format-picker-custom-input"
                    placeholder="Custom format..."
                    value={customFormat}
                    onInput={handleCustomFormatChange}
                    onKeyDown={handleCustomFormatKeyDown}
                    inputMode="numeric"
                />
                <button type="button" class="pack-format-picker-custom-btn" onClick={handleCustomFormatSubmit} disabled={!customFormat}>
                    Apply
                </button>
            </div>
        </div>
    );
}
