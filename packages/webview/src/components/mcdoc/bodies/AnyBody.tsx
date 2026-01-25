import type { JSX } from "preact";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { Body } from "../Body.tsx";
import { selectAnyType } from "../heads/AnyHead.tsx";

export function AnyBody({ node, ctx, optional }: NodeProps): JSX.Element | null {
    const selectedType = selectAnyType(node);

    if (!selectedType) {
        return null;
    }

    return <Body type={selectedType} node={node} ctx={ctx} optional={optional} />;
}
