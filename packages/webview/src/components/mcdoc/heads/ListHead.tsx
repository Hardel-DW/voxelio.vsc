import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { getDefault, getItemType, simplifyType } from "@/services/McdocHelpers.ts";

type ListType = Extract<SimplifiedMcdocType, { kind: "list" | "byte_array" | "int_array" | "long_array" | "tuple" }>;

// Misode: McdocRenderer.tsx:793-831
export function ListHead({ type, node, ctx }: NodeProps<ListType>): React.ReactNode {
    const arrayNode = JsonArrayNode.is(node) ? node : undefined;
    const itemCount = arrayNode?.children?.length ?? 0;

    const handleAdd = (): void => {
        ctx.makeEdit((range) => {
            const itemType = simplifyType(getItemType(type), ctx);
            const newValue = getDefault(itemType, range, ctx);
            // Misode: wraps value in ItemNode
            const newItem: ItemNode<JsonNode> = {
                type: "item",
                range,
                children: [newValue],
                value: newValue
            };
            newValue.parent = newItem;

            if (arrayNode) {
                // Misode: mutate directly then return parent
                arrayNode.children.push(newItem);
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
        <div className="list-head">
            <span className="list-count">{itemCount} items</span>
            <button type="button" className="add-button" onClick={handleAdd}>
                +
            </button>
        </div>
    );
}
