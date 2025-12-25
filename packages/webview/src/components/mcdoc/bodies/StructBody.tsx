import { Range } from "@spyglassmc/core";
import type { JsonPairNode } from "@spyglassmc/json";
import { JsonObjectNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import type { LiteralType } from "@spyglassmc/mcdoc";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, type SimplifiedMcdocField, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { getDefault, simplifyType } from "@/services/McdocHelpers.ts";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

// Misode: McdocRenderer.tsx:493-556
export function StructBody({ type: outerType, node, ctx }: NodeProps<StructType>): React.ReactNode {
    if (!JsonObjectNode.is(node)) {
        return null;
    }

    const type = node.typeDef?.kind === "struct" ? node.typeDef : outerType;
    const staticFields = type.fields.filter((field) => field.key.kind === "literal");

    return (
        <>
            {staticFields.map((field) => {
                const key = (field.key as LiteralType).value.value.toString();
                const index = node.children.findIndex((p) => p.key?.value === key);
                const pair = index === -1 ? undefined : node.children[index];
                return (
                    <StaticField
                        key={key}
                        pair={pair}
                        index={index}
                        field={field}
                        fieldKey={key}
                        staticFields={staticFields}
                        node={node}
                        ctx={ctx}
                    />
                );
            })}
        </>
    );
}

interface StaticFieldProps {
    pair: JsonPairNode | undefined;
    index: number;
    field: SimplifiedMcdocField;
    fieldKey: string;
    staticFields: SimplifiedMcdocField[];
    node: JsonObjectNode;
    ctx: McdocContext;
}

// Misode: McdocRenderer.tsx:569-647
function StaticField({ pair, index, field, fieldKey, staticFields, node, ctx }: StaticFieldProps): React.ReactNode {
    const child = pair?.value;
    const childType = simplifyType(field.type, ctx, { key: pair?.key, parent: node });
    const category = getCategory(field.type);

    // Misode: McdocRenderer.tsx:577-628
    const makeFieldEdit: MakeEdit = (edit) => {
        if (pair) {
            ctx.makeEdit(() => {
                const newChild = edit(child?.range ?? Range.create(pair.range.end));
                if (newChild === undefined) {
                    node.children.splice(index, 1);
                } else {
                    node.children[index] = {
                        type: "pair",
                        range: pair.range,
                        key: pair.key,
                        value: newChild
                    };
                }
                return node;
            });
        } else {
            const newFieldIndex = staticFields.indexOf(field);
            const insertIndex = node.children.findIndex((c) => {
                const childKey = c.key?.value;
                if (!childKey) return false;
                const otherChildIndex = staticFields.findIndex((f) => (f.key as LiteralType).value.value.toString() === childKey);
                return otherChildIndex > newFieldIndex;
            });
            const newChild = edit(Range.create(node.range.end));
            if (newChild) {
                ctx.makeEdit(() => {
                    const newPair: JsonPairNode = {
                        type: "pair",
                        range: newChild.range,
                        key: {
                            type: "json:string",
                            range: newChild.range,
                            options: JsonStringOptions,
                            value: fieldKey,
                            valueMap: [{ inner: Range.create(0), outer: newChild.range }]
                        },
                        value: newChild
                    };
                    if (insertIndex === -1) {
                        node.children.push(newPair);
                    } else {
                        node.children.splice(insertIndex, 0, newPair);
                    }
                    newPair.parent = node;
                    return node;
                });
            }
        }
    };

    const fieldCtx: McdocContext = { ...ctx, makeEdit: makeFieldEdit };

    const handleAdd = (): void => {
        makeFieldEdit((range) => getDefault(childType, range, ctx));
    };

    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                <Key label={fieldKey} doc={field.desc} />
                {!pair && field.optional && (
                    <button type="button" className="add" onClick={handleAdd}>
                        +
                    </button>
                )}
                {pair && <Head type={childType} node={child} optional={field.optional} ctx={fieldCtx} />}
            </div>
            {pair && <Body type={childType} node={child} optional={field.optional} ctx={fieldCtx} />}
        </div>
    );
}
