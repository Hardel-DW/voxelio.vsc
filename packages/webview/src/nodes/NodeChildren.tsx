import type { ListNode, SchemaNode, StructNode } from "@/types.ts";
import { NodeTree } from "@/nodes/NodeTree.tsx";

interface NodeChildrenProps {
    readonly node: SchemaNode;
    readonly path: readonly (string | number)[];
}

export function NodeChildren({ node, path }: NodeChildrenProps) {
    const children = getChildren(node);

    if (children.length === 0) return null;

    return (
        <div className="flex flex-col ml-4 border-l border-zinc-700">
            {children.map((child, index) => (
                <NodeTree key={child.key ?? index} node={child} path={[...path, child.key ?? index]} />
            ))}
        </div>
    );
}

function getChildren(node: SchemaNode): readonly SchemaNode[] {
    switch (node.kind) {
        case "struct":
            return (node as StructNode).fields;
        case "list":
            return (node as ListNode).items;
        default:
            return [];
    }
}
