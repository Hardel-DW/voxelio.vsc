import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
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
        <>
            {node.children.map((item, index) => (
                <ListItem key={String(index)} item={item} index={index} type={childType} node={node} ctx={ctx} />
            ))}
        </>
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
    const category = getCategory(type);
    const canMoveUp = index > 0;
    const canMoveDown = index < node.children.length - 1;

    const handleRemove = (): void => {
        ctx.makeEdit(() => {
            node.children.splice(index, 1);
            return node;
        });
    };

    const handleMoveUp = (): void => {
        if (!canMoveUp) return;
        ctx.makeEdit(() => {
            const moved = node.children.splice(index, 1);
            node.children.splice(index - 1, 0, ...moved);
            return node;
        });
    };

    const handleMoveDown = (): void => {
        if (!canMoveDown) return;
        ctx.makeEdit(() => {
            const moved = node.children.splice(index, 1);
            node.children.splice(index + 1, 0, ...moved);
            return node;
        });
    };

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

    // Misode structure: .node > .node-header + .node-body
    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                <button type="button" className="remove" onClick={handleRemove}>
                    ×
                </button>
                {(canMoveUp || canMoveDown) && (
                    <div className="node-move">
                        <button type="button" className="move" disabled={!canMoveUp} onClick={handleMoveUp}>
                            ↑
                        </button>
                        <button type="button" className="move" disabled={!canMoveDown} onClick={handleMoveDown}>
                            ↓
                        </button>
                    </div>
                )}
                <Key label={String(index)} raw />
                <Head type={type} node={child} ctx={itemCtx} />
            </div>
            <Body type={type} node={child} ctx={itemCtx} />
        </div>
    );
}
