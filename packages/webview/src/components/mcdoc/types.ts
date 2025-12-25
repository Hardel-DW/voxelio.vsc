import type { JsonNode } from "@spyglassmc/json";
import type { McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType, SimplifiedMcdocTypeNoUnion } from "@/services/McdocHelpers.ts";

export interface NodeProps<T extends SimplifiedMcdocType = SimplifiedMcdocType> {
    type: T;
    node: JsonNode | undefined;
    ctx: McdocContext;
    optional?: boolean;
    excludeStrings?: string[];
}

export type NodePropsNoUnion = NodeProps<SimplifiedMcdocTypeNoUnion>;
