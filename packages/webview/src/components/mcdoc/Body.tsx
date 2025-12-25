import { JsonArrayNode, JsonObjectNode } from "@spyglassmc/json";
import { ListBody } from "./bodies/ListBody.tsx";
import { StructBody } from "./bodies/StructBody.tsx";
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

    if (type.kind === "list" || type.kind === "byte_array" || type.kind === "int_array" || type.kind === "long_array") {
        if (!JsonArrayNode.is(node)) {
            return null;
        }
        return (
            <div className="node-body">
                <ListBody type={type} node={node} ctx={ctx} optional={optional} />
            </div>
        );
    }

    if (type.kind === "tuple") {
        if (!JsonArrayNode.is(node)) {
            return null;
        }
        return (
            <div className="node-body">
                <ListBody type={type} node={node} ctx={ctx} optional={optional} />
            </div>
        );
    }

    return null;
}
