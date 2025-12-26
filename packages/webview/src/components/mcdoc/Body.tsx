import { JsonArrayNode, JsonObjectNode } from "@spyglassmc/json";
import { getItemType, isFixedList, isInlineTuple, isListOrArray } from "@/services/McdocHelpers.ts";
import { ListBody } from "./bodies/ListBody.tsx";
import { StructBody } from "./bodies/StructBody.tsx";
import { TupleBody } from "./bodies/TupleBody.tsx";
import { UnionBody } from "./bodies/UnionBody.tsx";
import type { NodeProps } from "./types.ts";

// Misode: McdocRenderer.tsx:95-142
export function Body({ type, node, ctx, optional }: NodeProps): React.ReactNode {
    if (type.kind === "union") {
        return <UnionBody type={type} node={node} ctx={ctx} optional={optional} />;
    }

    if (type.kind === "struct") {
        if (!JsonObjectNode.is(node) || type.fields.length === 0) {
            return null;
        }
        return (
            <div className="node-body">
                <StructBody type={type} node={node} ctx={ctx} optional={optional} />
            </div>
        );
    }

    // Misode: McdocRenderer.tsx:107-125
    if (isListOrArray(type)) {
        if (!JsonArrayNode.is(node)) {
            return null;
        }
        // Misode: McdocRenderer.tsx:111-118 - Fixed length arrays treated as tuples
        if (isFixedList(type)) {
            const tupleType = {
                kind: "tuple" as const,
                items: [...Array(type.lengthRange.min)].map(() => getItemType(type)),
                attributes: type.attributes
            };
            if (isInlineTuple(tupleType)) {
                return null;
            }
            return (
                <div className="node-body">
                    <TupleBody type={tupleType} node={node} ctx={ctx} optional={optional} />
                </div>
            );
        }
        if (node.children?.length === 0) {
            return null;
        }
        return (
            <div className="node-body">
                <ListBody type={type} node={node} ctx={ctx} optional={optional} />
            </div>
        );
    }

    // Misode: McdocRenderer.tsx:127-133 - Inline tuples don't have a body
    if (type.kind === "tuple") {
        if (!JsonArrayNode.is(node) || isInlineTuple(type)) {
            return null;
        }
        return (
            <div className="node-body">
                <TupleBody type={type} node={node} ctx={ctx} optional={optional} />
            </div>
        );
    }

    return null;
}
