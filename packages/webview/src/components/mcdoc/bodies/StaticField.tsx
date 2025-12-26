import { Range } from "@spyglassmc/core";
import type { JsonObjectNode, JsonPairNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import type { LiteralType } from "@spyglassmc/mcdoc";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Errors, SimpleError } from "@/components/mcdoc/ErrorIndicator.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, type SimplifiedMcdocField, simplifyType } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:558-647
interface StaticFieldProps {
    pair: JsonPairNode | undefined;
    index: number;
    field: SimplifiedMcdocField;
    fieldKey: string;
    staticFields: SimplifiedMcdocField[];
    node: JsonObjectNode;
    ctx: McdocContext;
}

export function StaticField({ pair, index, field, fieldKey, staticFields, node, ctx }: StaticFieldProps): React.ReactNode {
    const child = pair?.value;
    const childType = simplifyType(field.type, ctx, { key: pair?.key, parent: node });
    const category = getCategory(field.type);
    const isMissingRequired = !field.optional && child === undefined;

    const makeFieldEdit: MakeEdit = (edit) => {
        pair ? updateExistingPair(edit, pair, child, index, node, ctx) : insertNewPair(edit, field, fieldKey, staticFields, node, ctx);
    };

    const fieldCtx: McdocContext = { ...ctx, makeEdit: makeFieldEdit };

    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                {isMissingRequired && <SimpleError message={`Missing required key "${fieldKey}"`} />}
                <Errors type={childType} node={child} ctx={ctx} />
                <Key label={fieldKey} doc={field.desc} />
                <Head type={childType} node={child} optional={field.optional} ctx={fieldCtx} />
            </div>
            <Body type={childType} node={child} optional={field.optional} ctx={fieldCtx} />
        </div>
    );
}

// Misode: McdocRenderer.tsx:577-592
function updateExistingPair(
    edit: (range: Range) => JsonPairNode["value"],
    pair: JsonPairNode,
    child: JsonPairNode["value"],
    index: number,
    node: JsonObjectNode,
    ctx: McdocContext
): void {
    ctx.makeEdit(() => {
        const newChild = edit(child?.range ?? Range.create(pair.range.end));
        if (newChild === undefined) {
            node.children.splice(index, 1);
        } else {
            node.children[index] = { type: "pair", range: pair.range, key: pair.key, value: newChild };
        }
        return node;
    });
}

// Misode: McdocRenderer.tsx:593-628
function insertNewPair(
    edit: (range: Range) => JsonPairNode["value"],
    field: SimplifiedMcdocField,
    fieldKey: string,
    staticFields: SimplifiedMcdocField[],
    node: JsonObjectNode,
    ctx: McdocContext
): void {
    const newFieldIndex = staticFields.indexOf(field);
    const insertIndex = node.children.findIndex((c) => {
        const childKey = c.key?.value;
        if (!childKey) return false;
        const otherIndex = staticFields.findIndex((f) => (f.key as LiteralType).value.value.toString() === childKey);
        return otherIndex > newFieldIndex;
    });

    const newChild = edit(Range.create(node.range.end));
    if (!newChild) return;

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
        insertIndex === -1 ? node.children.push(newPair) : node.children.splice(insertIndex, 0, newPair);
        newPair.parent = node;
        return node;
    });
}
