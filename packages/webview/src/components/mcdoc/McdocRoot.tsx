import type { JsonNode } from "@spyglassmc/json";
import type { McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { Body } from "./Body.tsx";
import { Head } from "./Head.tsx";

interface McdocRootProps {
    type: SimplifiedMcdocType;
    node: JsonNode | undefined;
    ctx: McdocContext;
}

export function McdocRoot({ type, node, ctx }: McdocRootProps): React.ReactNode {
    return (
        <div className="mcdoc-root">
            <div className="node">
                <div className="node-header">
                    <Head type={type} node={node} ctx={ctx} />
                </div>
                <div className="node-body">
                    <Body type={type} node={node} ctx={ctx} />
                </div>
            </div>
        </div>
    );
}
