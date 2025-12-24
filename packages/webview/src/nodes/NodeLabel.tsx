import { cn } from "@/lib/cn.ts";
import type { SchemaNode } from "@/types.ts";

interface NodeLabelProps {
    readonly node: SchemaNode;
}

const kindColors: Record<string, string> = {
    struct: "bg-amber-600",
    list: "bg-green-600",
    string: "bg-blue-600",
    number: "bg-purple-600",
    boolean: "bg-pink-600",
    enum: "bg-cyan-600",
    reference: "bg-orange-600",
    union: "bg-red-600"
};

export function NodeLabel({ node }: NodeLabelProps) {
    if (!node.key) return null;

    return (
        <span className="flex items-center gap-1.5 text-sm shrink-0">
            <span className={cn("w-1.5 h-1.5 rounded-full", kindColors[node.kind])} />
            <span className="text-zinc-300">{node.key}</span>
        </span>
    );
}
