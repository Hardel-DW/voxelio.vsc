import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { getItemType, simplifyType } from "@/services/McdocHelpers.ts";

type ListType = Extract<SimplifiedMcdocType, { kind: "list" | "byte_array" | "int_array" | "long_array" | "tuple" }>;

// Misode: McdocRenderer.tsx:833-897
export function ListBody({ type: outerType, node, ctx }: NodeProps<ListType>): React.ReactNode {
    if (!JsonArrayNode.is(node)) {
        return null;
    }

    const type = node.typeDef && isListOrArray(node.typeDef) ? node.typeDef : outerType;
    const childType = simplifyType(getItemType(type), ctx);

    return (
        <div className="list-body">
            {node.children.map((item, index) => (
                <ListItem key={String(index)} item={item} index={index} type={childType} node={node} ctx={ctx} />
            ))}
        </div>
    );
}

function isListOrArray(type: SimplifiedMcdocType): type is ListType {
    return (
        type.kind === "list" ||
        type.kind === "byte_array" ||
        type.kind === "int_array" ||
        type.kind === "long_array" ||
        type.kind === "tuple"
    );
}

interface ListItemProps {
    item: ItemNode<JsonNode>;
    index: number;
    type: SimplifiedMcdocType;
    node: JsonArrayNode;
    ctx: McdocContext;
}

// Misode: McdocRenderer.tsx:908-1008
function ListItem({ item, index, type, node, ctx }: ListItemProps): React.ReactNode {
    const child = item.value;

    // Misode: McdocRenderer.tsx:918-923 - mutate then return parent
    const handleRemove = (): void => {
        ctx.makeEdit(() => {
            node.children.splice(index, 1);
            return node;
        });
    };

    // Misode: McdocRenderer.tsx:925-934
    const handleMoveUp = (): void => {
        if (node.children.length <= 1 || index <= 0) return;
        ctx.makeEdit(() => {
            const moved = node.children.splice(index, 1);
            node.children.splice(index - 1, 0, ...moved);
            return node;
        });
    };

    // Misode: McdocRenderer.tsx:936-945
    const handleMoveDown = (): void => {
        if (node.children.length <= 1 || index >= node.children.length - 1) return;
        ctx.makeEdit(() => {
            const moved = node.children.splice(index, 1);
            node.children.splice(index + 1, 0, ...moved);
            return node;
        });
    };

    // Misode: McdocRenderer.tsx:954-964
    const makeItemEdit: MakeEdit = (edit) => {
        ctx.makeEdit(() => {
            const newChild = edit(child?.range ?? item.range);
            node.children[index] = {
                type: "item",
                range: item.range,
                value: newChild
            };
            return node;
        });
    };

    const itemCtx: McdocContext = { ...ctx, makeEdit: makeItemEdit };

    return (
        <div className="list-item">
            <div className="item-header">
                <span className="item-index">{index}</span>
                <div className="item-controls">
                    <button type="button" onClick={handleMoveUp} disabled={index === 0}>
                        ↑
                    </button>
                    <button type="button" onClick={handleMoveDown} disabled={index >= node.children.length - 1}>
                        ↓
                    </button>
                    <button type="button" onClick={handleRemove}>
                        ×
                    </button>
                </div>
                <Head type={type} node={child} ctx={itemCtx} />
            </div>
            <Body type={type} node={child} ctx={itemCtx} />
        </div>
    );
}
