import type { ListNode, SchemaNode } from "@/types.ts";

interface NodeActionsProps {
    readonly node: SchemaNode;
    readonly path: readonly (string | number)[];
}

export function NodeActions({ node }: NodeActionsProps) {
    if (node.kind !== "list") return null;

    const listNode = node as ListNode;

    return (
        <button
            type="button"
            className="flex items-center justify-center w-5 h-5 rounded bg-green-600 hover:bg-green-500 text-white text-xs"
            onClick={() => console.log("add item", listNode.itemType)}>
            +
        </button>
    );
}
