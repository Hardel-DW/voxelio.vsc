import type { ReferenceNode } from "@/types.ts";
import { BaseInput } from "@/nodes/inputs/BaseInput.tsx";

interface ReferenceInputProps {
    readonly node: ReferenceNode;
    readonly path: readonly (string | number)[];
}

export function ReferenceInput({ node }: ReferenceInputProps) {
    return <BaseInput value={node.value} onChange={() => { }} placeholder={`${node.registry}:...`} />;
}
