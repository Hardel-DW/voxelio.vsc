import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

export function StructHead({ type }: NodeProps<StructType>): React.ReactNode {
    const fieldCount = type.fields.length;
    return <span className="struct-info">{fieldCount} fields</span>;
}
