import { useExtensionMessages } from "./hooks/useExtensionMessages.ts";
import { NodeTree } from "@/nodes/NodeTree.tsx";
import { useEditorStore } from "@/stores/editor.ts";
import type { StructNode } from "@/types.ts";

const mockSchema: StructNode = {
    kind: "struct",
    fields: [
        {
            kind: "enum",
            key: "type",
            value: "minecraft:crafting_shaped",
            options: ["minecraft:crafting_shaped", "minecraft:crafting_shapeless", "minecraft:smelting"]
        },
        { kind: "string", key: "group", value: "boat" },
        { kind: "enum", key: "category", value: "misc", options: ["misc", "building", "redstone", "equipment", "food"] },
        {
            kind: "list",
            key: "pattern",
            itemType: { kind: "string", value: "" },
            items: [
                { kind: "string", value: "# #" },
                { kind: "string", value: "###" }
            ]
        },
        {
            kind: "struct",
            key: "key",
            fields: [{ kind: "reference", key: "#", registry: "item", value: "minecraft:acacia_planks" }]
        },
        {
            kind: "struct",
            key: "result",
            fields: [
                { kind: "reference", key: "id", registry: "item", value: "minecraft:acacia_boat" },
                { kind: "number", key: "count", value: 1, min: 1, max: 64, integer: true }
            ]
        },
        { kind: "boolean", key: "show_notification", value: true }
    ]
};

export function App() {
    useExtensionMessages();
    const packFormat = useEditorStore((s) => s.packFormat);

    return <div className="flex flex-col gap-1 p-2">{packFormat !== null && <NodeTree node={mockSchema} path={[]} />}</div>;
}
