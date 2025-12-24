import type { SchemaNode } from "@/types.ts";
import { NodeChildren } from "@/nodes/NodeChildren.tsx";
import { NodeRow } from "@/nodes/NodeRow.tsx";

interface NodeTreeProps {
    readonly node: SchemaNode;
    readonly path: readonly (string | number)[];
}

export function NodeTree({ node, path }: NodeTreeProps) {
    const hasChildren = node.kind === "struct" || node.kind === "list";

    return (
        <div className="flex flex-col">
            <NodeRow node={node} path={path} />
            {hasChildren && <NodeChildren node={node} path={path} />}
        </div>
    );
}
