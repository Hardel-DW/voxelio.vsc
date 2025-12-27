import type { JsonNode } from "@spyglassmc/json";
import { JsonObjectNode } from "@spyglassmc/json";
import type { JSX } from "preact";
import type { McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { Body } from "./Body.tsx";
import { StructBody } from "./bodies/StructBody.tsx";
import { Head } from "./Head.tsx";
import { Key } from "./Key.tsx";

interface McdocRootProps {
    type: SimplifiedMcdocType;
    node: JsonNode | undefined;
    ctx: McdocContext;
}

// Misode: McdocRenderer.tsx:41-56
export function McdocRoot({ type, node, ctx }: McdocRootProps): JSX.Element | null {
    if (type.kind === "struct" && type.fields.length > 0 && JsonObjectNode.is(node)) {
        return <StructBody type={type} node={node} ctx={ctx} />;
    }

    return (
        <>
            <div class="node-header">
                <Key label="root" />
                <Head type={type} node={node} ctx={ctx} />
            </div>
            <Body type={type} node={node} ctx={ctx} />
        </>
    );
}
