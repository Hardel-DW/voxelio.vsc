import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { getDefault, getItemType, simplifyType } from "@/services/McdocHelpers.ts";

type ListType = Extract<SimplifiedMcdocType, { kind: "list" | "byte_array" | "int_array" | "long_array" | "tuple" }>;

// Misode: McdocRenderer.tsx:795-831
export function ListHead({ type, node, ctx, optional }: NodeProps<ListType>): React.ReactNode {
    const arrayNode = JsonArrayNode.is(node) ? node : undefined;
    const itemCount = arrayNode?.children?.length ?? 0;

    // Misode: ListHead only shows "+" button, count is shown separately
    // Don't show if node doesn't exist and field is optional (StaticField shows its own + button)
    if (!arrayNode && optional) {
        return null;
    }

    const handleAdd = (): void => {
        ctx.makeEdit((range) => {
            const itemType = simplifyType(getItemType(type), ctx);
            const newValue = getDefault(itemType, range, ctx);
            const newItem: ItemNode<JsonNode> = {
                type: "item",
                range,
                children: [newValue],
                value: newValue
            };
            newValue.parent = newItem;

            if (arrayNode) {
                arrayNode.children.unshift(newItem);
                newItem.parent = arrayNode;
                return arrayNode;
            }

            const newArray: JsonArrayNode = {
                type: "json:array",
                range,
                children: [newItem]
            };
            newItem.parent = newArray;
            return newArray;
        });
    };

    return (
        <button type="button" className="add" onClick={handleAdd}>
            {Octicon.plus}
        </button>
    );
}
