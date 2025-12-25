import { Range } from "@spyglassmc/core";
import type { JsonPairNode } from "@spyglassmc/json";
import { type JsonObjectNode, JsonStringNode } from "@spyglassmc/json";
import type { McdocType } from "@spyglassmc/mcdoc";
import { useState } from "react";
import { Head } from "@/components/mcdoc/Head.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getDefault, type SimplifiedMcdocType, simplifyType } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:649-705
interface DynamicKeyProps {
    keyType: SimplifiedMcdocType;
    valueType: McdocType;
    parent: JsonObjectNode;
    ctx: McdocContext;
}

export function DynamicKey({ keyType, valueType, parent, ctx }: DynamicKeyProps): React.ReactNode {
    const [key, setKey] = useState<string>();

    const keyNode = createKeyNode(key);
    const excludeStrings = parent.children.flatMap((pair) => (pair.key ? [pair.key.value] : []));

    const makeKeyEdit: MakeEdit = (edit) => {
        const newKeyNode = edit(Range.create(0));
        if (JsonStringNode.is(newKeyNode)) setKey(newKeyNode.value);
    };

    const handleAdd = (): void => {
        if (!keyNode) return;
        setKey(undefined);
        ctx.makeEdit((range) => createPairAndAttach(keyNode, valueType, parent, range, ctx));
    };

    const keyCtx: McdocContext = { ...ctx, makeEdit: makeKeyEdit };
    const isDisabled = !key || key.length === 0;

    return (
        <>
            <Head type={keyType} optional excludeStrings={excludeStrings} node={keyNode} ctx={keyCtx} />
            <button type="button" className="add" onClick={handleAdd} disabled={isDisabled}>
                +
            </button>
        </>
    );
}

// Misode: McdocRenderer.tsx:659-664
function createKeyNode(key: string | undefined): JsonStringNode | undefined {
    if (key === undefined) return undefined;
    const node = JsonStringNode.mock(Range.create(0));
    node.value = key;
    return node;
}

// Misode: McdocRenderer.tsx:682-694
function createPairAndAttach(
    keyNode: JsonStringNode,
    valueType: McdocType,
    parent: JsonObjectNode,
    range: Range,
    ctx: McdocContext
): JsonObjectNode {
    const valueNode = getDefault(simplifyType(valueType, ctx, { key: keyNode, parent }), range, ctx);
    const newPair: JsonPairNode = { type: "pair", range: keyNode.range, key: keyNode, value: valueNode };
    valueNode.parent = newPair;
    newPair.parent = parent;
    parent.children.push(newPair);
    return parent;
}
