import { useState } from "react";
import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import { Octicon } from "@/components/Icons.tsx";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, getDefault, getItemType, type SimplifiedMcdocType, simplifyType } from "@/services/McdocHelpers.ts";
import { StructBody } from "./StructBody.tsx";

type ListType = Extract<SimplifiedMcdocType, { kind: "list" | "byte_array" | "int_array" | "long_array" | "tuple" }>;

// Misode: McdocRenderer.tsx:833-897
export function ListBody({ type: outerType, node, ctx }: NodeProps<ListType>): React.ReactNode {
    if (!JsonArrayNode.is(node)) {
        return null;
    }

    const type = node.typeDef && isListOrArray(node.typeDef) ? node.typeDef : outerType;
    const itemType = getItemType(type);
    const category = getCategory(itemType);
    const childType = simplifyType(itemType, ctx);

    // Misode: McdocRenderer.tsx:848-874
    const handleAddBottom = (): void => {
        ctx.makeEdit((range) => {
            const newValue = getDefault(childType, range, ctx);
            const newItem: ItemNode<JsonNode> = {
                type: "item",
                range,
                children: [newValue],
                value: newValue
            };
            newValue.parent = newItem;
            node.children.push(newItem);
            newItem.parent = node;
            return node;
        });
    };

    return (
        <>
            {node.children.map((item, index) => (
                <ListItem key={String(index)} item={item} index={index} category={category} type={childType} node={node} ctx={ctx} />
            ))}
            {node.children.length > 0 && (
                <div className="node-header">
                    <button type="button" className="add" onClick={handleAddBottom}>
                        {Octicon.plus}
                    </button>
                </div>
            )}
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
    category: string | undefined;
    type: SimplifiedMcdocType;
    node: JsonArrayNode;
    ctx: McdocContext;
}

// Misode: McdocRenderer.tsx:908-1008
function ListItem({ item, index, category, type, node, ctx }: ListItemProps): React.ReactNode {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const child = item.value;
    const canMoveUp = index > 0;
    const canMoveDown = index < node.children.length - 1;
    const canToggle = type.kind === "struct" || type.kind === "list" || type.kind === "union";

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

    // Misode: McdocRenderer.tsx:1001-1005 - use node-body-flat for struct with category
    const renderBody = (): React.ReactNode => {
        if (isCollapsed) return null;
        if (type.kind === "struct" && category) {
            return (
                <div className="node-body-flat">
                    <StructBody type={type} node={child} ctx={itemCtx} />
                </div>
            );
        }
        return <Body type={type} node={child} ctx={itemCtx} />;
    };

    // Misode structure: toggle → delete → order → label → content
    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                {canToggle && (
                    <button type="button" className="toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? Octicon.chevron_right : Octicon.chevron_down}
                    </button>
                )}
                <button type="button" className="remove" onClick={handleRemove}>
                    {Octicon.trashcan}
                </button>
                {(canMoveUp || canMoveDown) && (
                    <div className="node-move">
                        <button type="button" className="move" disabled={!canMoveUp} onClick={handleMoveUp}>
                            {Octicon.chevron_up}
                        </button>
                        <button type="button" className="move" disabled={!canMoveDown} onClick={handleMoveDown}>
                            {Octicon.chevron_down}
                        </button>
                    </div>
                )}
                <Key label="Entry" />
                {!isCollapsed && <Head type={type} node={child} ctx={itemCtx} />}
            </div>
            {renderBody()}
        </div>
    );
}
