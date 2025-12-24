import type { EnumNode } from "@/types.ts";
import { BaseSelect } from "@/nodes/inputs/BaseSelect.tsx";

interface EnumInputProps {
    readonly node: EnumNode;
    readonly path: readonly (string | number)[];
}

export function EnumInput({ node }: EnumInputProps) {
    return <BaseSelect value={node.value} onChange={() => { }} options={node.options} />;
}
