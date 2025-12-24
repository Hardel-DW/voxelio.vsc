import type { JsonNode } from "@spyglassmc/json";
import type { UnionType } from "@spyglassmc/mcdoc";
import { Head } from "@/components/mcdoc/Head.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType, SimplifiedMcdocTypeNoUnion } from "@/services/McdocHelpers.ts";
import { formatIdentifier, getChange, getDefault, quickEqualTypes } from "@/services/McdocHelpers.ts";

type UnionTypeDef = Extract<SimplifiedMcdocType, { kind: "union" }>;

// Misode: McdocRenderer.tsx:384-417
export function UnionHead({ type, optional, node, ctx }: NodeProps<UnionTypeDef>): React.ReactNode {
    if (type.members.length === 0) {
        return null;
    }

    const selectedType = selectUnionMember(type, node);
    const memberIndex = selectedType ? type.members.findIndex((m) => quickEqualTypes(m, selectedType)) : -1;

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const newValue = e.target.value;
        ctx.makeEdit((range) => {
            if (newValue === "") {
                return undefined;
            }
            const newSelected = type.members[Number.parseInt(newValue, 10)];
            if (node && selectedType) {
                return getChange(newSelected, selectedType, node, ctx);
            }
            return getDefault(newSelected, range, ctx);
        });
    };

    return (
        <div className="union-head">
            <select value={memberIndex > -1 ? memberIndex : ""} onChange={handleSelect}>
                {(selectedType === undefined || optional) && <option value="">Select...</option>}
                {type.members.map((member, index) => (
                    <option key={String(index)} value={String(index)}>
                        {formatUnionMember(
                            member,
                            type.members.filter((m) => m !== member)
                        )}
                    </option>
                ))}
            </select>
            {selectedType && selectedType.kind !== "literal" && <Head type={selectedType} node={node} ctx={ctx} />}
        </div>
    );
}

// Misode: McdocRenderer.tsx:419-435
function formatUnionMember(type: SimplifiedMcdocTypeNoUnion, others: SimplifiedMcdocTypeNoUnion[]): string {
    if (type.kind === "literal") {
        return formatIdentifier(type.value.value.toString());
    }
    if (!others.some((o) => o.kind === type.kind)) {
        return formatIdentifier(type.kind === "struct" ? "object" : type.kind);
    }
    if (type.kind === "struct") {
        const firstKey = type.fields.find((f) => f.key.kind === "literal")?.key;
        if (firstKey && firstKey.kind === "literal") {
            return formatUnionMember(firstKey, []);
        }
    }
    return formatIdentifier(type.kind === "struct" ? "object" : type.kind);
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
