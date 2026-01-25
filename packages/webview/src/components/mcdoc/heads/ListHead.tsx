import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { getDefault, getItemType, simplifyType } from "@/services/McdocHelpers.ts";

type ListType = Extract<SimplifiedMcdocType, { kind: "list" | "byte_array" | "int_array" | "long_array" | "tuple" }>;

// Misode: McdocRenderer.tsx:795-831
export function ListHead({ type, node, ctx }: NodeProps<ListType>): JSX.Element | null {
    const arrayNode = JsonArrayNode.is(node) ? node : undefined;
    const maxLength = type.kind === "tuple" ? type.items.length : (type.lengthRange?.max ?? Number.POSITIVE_INFINITY);
    const canAdd = maxLength > (arrayNode?.children?.length ?? 0);

    const handleAdd = (): void => {
        if (!canAdd) return;
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

            const newArray: JsonArrayNode = { type: "json:array", range, children: [newItem] };
            newItem.parent = newArray;
            return newArray;
        });
    };

    return (
        <button type="button" class="add" onClick={handleAdd} disabled={!canAdd}>
            {Octicon.plus}
        </button>
    );
}
