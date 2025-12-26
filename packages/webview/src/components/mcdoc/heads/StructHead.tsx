import { JsonObjectNode } from "@spyglassmc/json";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import { getDefault, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

// Misode: McdocRenderer.tsx:459-491
export function StructHead({ type: outerType, node, ctx, optional }: NodeProps<StructType>): React.ReactNode {
    const type = node?.typeDef?.kind === "struct" ? node.typeDef : outerType;

    const handleRemove = (): void => {
        ctx.makeEdit(() => undefined);
    };

    const handleSetDefault = (): void => {
        ctx.makeEdit((range) => getDefault(type, range, ctx));
    };

    if (optional) {
        return JsonObjectNode.is(node) ? (
            <button type="button" className="remove" onClick={handleRemove}>
                {Octicon.trashcan}
            </button>
        ) : (
            <button type="button" className="add" onClick={handleSetDefault}>
                {Octicon.plus}
            </button>
        );
    }

    if (!JsonObjectNode.is(node)) {
        return (
            <button type="button" className="add" onClick={handleSetDefault}>
                {Octicon.random}
            </button>
        );
    }

    return null;
}
