import { JsonObjectNode } from "@spyglassmc/json";
import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { getDefault } from "@/services/McdocHelpers.ts";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

// Misode: McdocRenderer.tsx:459-491
export function StructHead({ type: outerType, node, ctx, optional }: NodeProps<StructType>): JSX.Element | null {
    const type = node?.typeDef?.kind === "struct" ? node.typeDef : outerType;

    const handleRemove = (): void => {
        ctx.makeEdit(() => undefined);
    };

    const handleSetDefault = (): void => {
        ctx.makeEdit((range) => getDefault(type, range, ctx));
    };

    if (optional) {
        return JsonObjectNode.is(node) ? (
            <button type="button" class="remove" onClick={handleRemove}>
                {Octicon.trashcan}
            </button>
        ) : (
            <button type="button" class="add" onClick={handleSetDefault}>
                {Octicon.plus}
            </button>
        );
    }

    if (!JsonObjectNode.is(node)) {
        return (
            <button type="button" class="add" onClick={handleSetDefault}>
                {Octicon.random}
            </button>
        );
    }

    return null;
}
