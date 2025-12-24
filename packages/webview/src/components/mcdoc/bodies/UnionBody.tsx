import type { JsonNode } from "@spyglassmc/json";
import type { UnionType } from "@spyglassmc/mcdoc";
import { Body } from "@/components/mcdoc/Body.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType, SimplifiedMcdocTypeNoUnion } from "@/services/McdocHelpers.ts";
import { quickEqualTypes } from "@/services/McdocHelpers.ts";

type UnionTypeDef = Extract<SimplifiedMcdocType, { kind: "union" }>;

// Misode: McdocRenderer.tsx:437-443
export function UnionBody({ type, optional, node, ctx }: NodeProps<UnionTypeDef>): React.ReactNode {
    const selectedType = selectUnionMember(type, node);
    if (selectedType === undefined) {
        return null;
    }
    return <Body type={selectedType} optional={optional} node={node} ctx={ctx} />;
}

// Misode: McdocRenderer.tsx:445-457
function selectUnionMember(
    union: UnionType<SimplifiedMcdocTypeNoUnion>,
    node: JsonNode | undefined
): SimplifiedMcdocTypeNoUnion | undefined {
    const selectedType = (node as JsonNode & { typeDef?: SimplifiedMcdocType })?.typeDef;
    if (!selectedType || selectedType.kind === "any" || selectedType.kind === "unsafe") {
        return undefined;
    }
    if (selectedType.kind === "union") {
        return selectedType.members.find((m1) => union.members.find((m2) => quickEqualTypes(m1, m2)));
    }
    return selectedType;
}
