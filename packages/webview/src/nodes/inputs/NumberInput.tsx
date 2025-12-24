import type { NumberNode } from "@/types.ts";
import { BaseInput } from "@/nodes/inputs/BaseInput.tsx";

interface NumberInputProps {
    readonly node: NumberNode;
    readonly path: readonly (string | number)[];
}

export function NumberInput({ node }: NumberInputProps) {
    return <BaseInput type="number" value={String(node.value)} onChange={() => { }} min={node.min} max={node.max} />;
}
