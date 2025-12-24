import type { SchemaNode } from "@/types.ts";
import { NodeActions } from "@/nodes/NodeActions.tsx";
import { NodeInput } from "@/nodes/NodeInput.tsx";
import { NodeLabel } from "@/nodes/NodeLabel.tsx";

interface NodeRowProps {
    readonly node: SchemaNode;
    readonly path: readonly (string | number)[];
}

export function NodeRow({ node, path }: NodeRowProps) {
    const isContainer = node.kind === "struct" || node.kind === "list";

    return (
        <div className="flex items-center gap-2 min-h-7 px-2 rounded hover:bg-zinc-800/50">
            {isContainer && <NodeActions node={node} path={path} />}
            <NodeLabel node={node} />
            {!isContainer && <NodeInput node={node} path={path} />}
        </div>
    );
}
