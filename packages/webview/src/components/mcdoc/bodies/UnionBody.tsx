import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Body } from "@/components/mcdoc/Body.tsx";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { selectUnionMember } from "@/services/McdocHelpers.ts";

type UnionTypeDef = Extract<SimplifiedMcdocType, { kind: "union" }>;

// Misode: McdocRenderer.tsx:437-443
export function UnionBody({ type, optional, node, ctx }: NodeProps<UnionTypeDef>): JSX.Element | null {
    const selectedType = selectUnionMember(type, node);
    if (selectedType === undefined) {
        return null;
    }
    return <Body type={selectedType} optional={optional} node={node} ctx={ctx} />;
}
