import { cn } from "@/lib/cn.ts";
import type { BooleanNode } from "@/types.ts";

interface BooleanInputProps {
    readonly node: BooleanNode;
    readonly path: readonly (string | number)[];
}

export function BooleanInput({ node }: BooleanInputProps) {
    return (
        <div className="flex gap-1">
            <ToggleButton label="False" active={!node.value} onClick={() => { }} />
            <ToggleButton label="True" active={node.value} onClick={() => { }} />
        </div>
    );
}

interface ToggleButtonProps {
    readonly label: string;
    readonly active: boolean;
    readonly onClick: () => void;
}

function ToggleButton({ label, active, onClick }: ToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-2 py-0.5 rounded text-sm",
                active ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            )}>
            {label}
        </button>
    );
}
