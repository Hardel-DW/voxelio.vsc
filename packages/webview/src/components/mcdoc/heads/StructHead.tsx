import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

// Misode: StructHead is typically empty, struct content is in StructBody
export function StructHead(_props: NodeProps<StructType>): React.ReactNode {
    return null;
}
