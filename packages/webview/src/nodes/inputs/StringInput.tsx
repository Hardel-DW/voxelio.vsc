import type { StringNode } from "@/types.ts";
import { BaseInput } from "@/nodes/inputs/BaseInput.tsx";

interface StringInputProps {
    readonly node: StringNode;
    readonly path: readonly (string | number)[];
}

export function StringInput({ node }: StringInputProps) {
    return <BaseInput value={node.value} onChange={() => { }} />;
}
