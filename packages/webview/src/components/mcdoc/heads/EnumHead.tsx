import { Range } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import type { JSX } from "preact";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { formatIdentifier } from "@/services/McdocHelpers.ts";

type EnumType = Extract<SimplifiedMcdocType, { kind: "enum" }>;

// Misode: McdocRenderer.tsx:237-291
export function EnumHead({ type, node, ctx }: NodeProps<EnumType>): JSX.Element | null {
    const value = JsonStringNode.is(node) ? node.value : undefined;

    const handleChange = (e: JSX.TargetedEvent<HTMLSelectElement>): void => {
        const newValue = e.currentTarget.value;
        if (value === newValue) return;

        ctx.makeEdit((range) => {
            if (newValue === "") {
                return undefined;
            }
            // Misode: creates json:string with proper options and valueMap
            return {
                type: "json:string",
                range,
                options: JsonStringOptions,
                value: newValue,
                valueMap: [{ inner: Range.create(0), outer: Range.create(range.start) }]
            };
        });
    };

    // Misode: direct <select> in node-header
    return (
        <select value={value ?? ""} onInput={handleChange}>
            <option value="">Select...</option>
            {type.values.map((enumValue) => (
                <option key={String(enumValue.value)} value={String(enumValue.value)}>
                    {formatIdentifier(String(enumValue.identifier ?? enumValue.value))}
                </option>
            ))}
        </select>
    );
}
