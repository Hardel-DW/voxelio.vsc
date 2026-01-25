import { getVersionsForPackType, type PackType } from "@voxel/shared/versions";
import { useState } from "preact/hooks";
import { CustomFormatInput } from "@/components/CustomFormatInput.tsx";

export function PackFormatPicker(props: { onSelect: (packFormat: number) => void }) {
    const { onSelect } = props;
    const [packType, setPackType] = useState<PackType>("datapack");
    const versions = getVersionsForPackType(packType);

    return (
        <div class="pack-format-picker">
            <div class="pack-format-picker-tabs">
                <button
                    type="button"
                    class={`pack-format-picker-tab ${packType === "datapack" ? "active" : ""}`}
                    onClick={() => setPackType("datapack")}>
                    Datapack
                </button>
                <button
                    type="button"
                    class={`pack-format-picker-tab ${packType === "resourcepack" ? "active" : ""}`}
                    onClick={() => setPackType("resourcepack")}>
                    Resourcepack
                </button>
            </div>
            <ul class="pack-format-picker-list">
                {versions.toReversed().map((v) => (
                    <li key={v.packFormat}>
                        <button type="button" class="pack-format-picker-item" onClick={() => onSelect(v.packFormat)}>
                            <span class="pack-format-picker-item-version">{v.version.id}</span>
                            <span class="pack-format-picker-item-format">Format {v.packFormat}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <CustomFormatInput onSubmit={onSelect} placeholder="Custom format..." className="pack-format-picker-custom" />
        </div>
    );
}
