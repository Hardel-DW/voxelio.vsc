import type { ItemNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { getDefault, isInlineTuple, simplifyType } from "@/services/McdocHelpers.ts";

type TupleTypeDef = Extract<SimplifiedMcdocType, { kind: "tuple" }>;

// Misode: McdocRenderer.tsx:1010-1049
export function TupleHead({ type, node, ctx, optional }: NodeProps<TupleTypeDef>): JSX.Element | null {
    const arrayNode = JsonArrayNode.is(node) ? node : undefined;
    const isInline = isInlineTuple(type);

    const handleRemove = (): void => {
        ctx.makeEdit(() => undefined);
    };

    const handleSetDefault = (): void => {
        ctx.makeEdit((range) => getDefault(type, range, ctx));
    };

    if (!isInline) {
        const maxLength = type.items.length;
        const canAdd = maxLength > (arrayNode?.children?.length ?? 0);

        const handleAdd = (): void => {
            if (!canAdd) return;
            ctx.makeEdit((range) => {
                const itemType = simplifyType(type.items[arrayNode?.children?.length ?? 0], ctx);
                const newValue = getDefault(itemType, range, ctx);
                const newItem: ItemNode<JsonNode> = { type: "item", range, children: [newValue], value: newValue };
                newValue.parent = newItem;

                if (arrayNode) {
                    arrayNode.children.push(newItem);
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

    // Inline tuple (UUID etc): single delete/+ button + all items inline
    return (
        <>
            {optional ? (
                arrayNode ? (
                    <button type="button" class="remove" onClick={handleRemove}>
                        {Octicon.trashcan}
                    </button>
                ) : (
                    <button type="button" class="add" onClick={handleSetDefault}>
                        {Octicon.plus}
                    </button>
                )
            ) : (
                !arrayNode && (
                    <button type="button" class="add" onClick={handleSetDefault}>
                        {Octicon.random}
                    </button>
                )
            )}
            {arrayNode &&
                type.items.map((itemType, index) => {
                    const item = arrayNode.children[index];
                    const child = item?.value;
                    const childType = simplifyType(itemType, ctx);
                    return (
                        <TupleHeadItem
                            key={index.toString()}
                            child={child}
                            childType={childType}
                            index={index}
                            node={arrayNode}
                            ctx={ctx}
                        />
                    );
                })}
        </>
    );
}

// Misode: McdocRenderer.tsx:1057-1078
interface TupleHeadItemProps {
    child: JsonNode | undefined;
    childType: SimplifiedMcdocType;
    index: number;
    node: JsonArrayNode;
    ctx: McdocContext;
}

function TupleHeadItem({ child, childType, index, node, ctx }: TupleHeadItemProps): JSX.Element | null {
    const makeItemEdit: MakeEdit = (edit) => {
        ctx.makeEdit((range) => {
            const newChild = edit(child?.range ?? node.range ?? range);
            if (newChild === undefined) {
                return node;
            }
            node.children[index] = { type: "item", range: newChild.range, value: newChild, children: [newChild] };
            return node;
        });
    };

    const itemCtx: McdocContext = { ...ctx, makeEdit: makeItemEdit };
    return <Head type={childType} node={child} ctx={itemCtx} />;
}
