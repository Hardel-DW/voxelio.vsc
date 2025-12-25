import type { FloatNode, LongNode } from "@spyglassmc/core";
import { JsonNumberNode } from "@spyglassmc/json";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type NumericType = Extract<SimplifiedMcdocType, { kind: "byte" | "short" | "int" | "long" | "float" | "double" }>;

// Misode: McdocRenderer.tsx:294-359
export function NumericHead({ type, node, ctx }: NodeProps<NumericType>): React.ReactNode {
    const nodeValue = node && JsonNumberNode.is(node) ? Number(node.value.value) : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        const number = value.length === 0 ? undefined : Number(value);
        if (number !== undefined && Number.isNaN(number)) return;

        ctx.makeEdit((range) => {
            if (number === undefined) {
                return undefined;
            }
            const newValue: FloatNode | LongNode = Number.isInteger(number)
                ? { type: "long", range, value: BigInt(number) }
                : { type: "float", range, value: number };
            const newNode: JsonNumberNode = {
                type: "json:number",
                range,
                value: newValue,
                children: [newValue]
            };
            newValue.parent = newNode;
            return newNode;
        });
    };

    // Misode: uses class="short-input" for numeric inputs
    return <input className="short-input" type="number" value={nodeValue ?? ""} onChange={handleChange} />;
}
