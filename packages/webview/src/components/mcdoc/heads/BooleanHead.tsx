import { JsonBooleanNode } from "@spyglassmc/json";
import type { NodeProps } from "@/components/mcdoc/types.ts";

// Misode: McdocRenderer.tsx:362-381
// Note: Misode uses generic Props, not specific type
export function BooleanHead({ node, ctx }: NodeProps): React.ReactNode {
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
        <div className="boolean-toggle">
            <button type="button" className={value === false ? "selected" : ""} onClick={() => handleSelect(false)}>
                False
            </button>
            <button type="button" className={value === true ? "selected" : ""} onClick={() => handleSelect(true)}>
                True
            </button>
        </div>
    );
}
