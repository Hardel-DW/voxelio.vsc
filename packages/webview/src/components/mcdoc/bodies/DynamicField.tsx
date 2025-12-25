import { Range } from "@spyglassmc/core";
import type { JsonObjectNode, JsonPairNode } from "@spyglassmc/json";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, type SimplifiedMcdocField, simplifyType } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:707-760
interface DynamicFieldProps {
    pair: JsonPairNode;
    index: number;
    field: SimplifiedMcdocField;
    fieldKey: string;
    node: JsonObjectNode;
    ctx: McdocContext;
}

export function DynamicField({ pair, index, field, fieldKey, node, ctx }: DynamicFieldProps): React.ReactNode {
    const child = pair.value;
    const childType = simplifyType(field.type, ctx, { key: pair.key, parent: node });
    const category = getCategory(field.type);

    const makeFieldEdit: MakeEdit = (edit) => {
        ctx.makeEdit(() => {
            const newChild = edit(child?.range ?? Range.create(pair.range.end));
            if (newChild === undefined) {
                node.children.splice(index, 1);
            } else {
                node.children[index] = { type: "pair", range: pair.range, key: pair.key, value: newChild };
            }
            return node;
        });
    };

    const handleRemove = (): void => {
        ctx.makeEdit(() => {
            node.children.splice(index, 1);
            return node;
        });
    };

    const fieldCtx: McdocContext = { ...ctx, makeEdit: makeFieldEdit };

    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                <button type="button" className="remove" onClick={handleRemove}>
                    🗑
                </button>
                <Key label={fieldKey} raw />
                <Head type={childType} node={child} ctx={fieldCtx} />
            </div>
            <Body type={childType} node={child} ctx={fieldCtx} />
        </div>
    );
}
