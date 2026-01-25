import { JsonBooleanNode } from "@spyglassmc/json";
import type { JSX } from "preact";
import type { NodeProps } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:362-381
export function BooleanHead({ node, ctx }: NodeProps): JSX.Element | null {
    const value = node && JsonBooleanNode.is(node) ? node.value : undefined;

    const handleSelect = (newValue: boolean): void => {
        ctx.makeEdit((range) => {
            if (value === newValue) {
                return undefined;
            }
            return { type: "json:boolean", range, value: newValue };
        });
    };

    return (
        <>
            <button type="button" class={value === false ? "selected" : ""} onClick={() => handleSelect(false)}>
                False
            </button>
            <button type="button" class={value === true ? "selected" : ""} onClick={() => handleSelect(true)}>
                True
            </button>
        </>
    );
}
