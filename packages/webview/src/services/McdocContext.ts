import type { CheckerContext, Range } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";

export type MakeEdit = (edit: (range: Range) => JsonNode | undefined) => void;

export interface McdocContext extends CheckerContext {
    makeEdit: MakeEdit;
}
