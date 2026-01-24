import { Range } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import type { JSX } from "preact";
import { Select } from "@/components/Select.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { formatIdentifier } from "@/services/McdocHelpers.ts";

type EnumType = Extract<SimplifiedMcdocType, { kind: "enum" }>;

// Misode: McdocRenderer.tsx:237-291
export function EnumHead({ type, node, ctx }: NodeProps<EnumType>): JSX.Element | null {
    const value = JsonStringNode.is(node) ? node.value : undefined;

    const handleChange = (newValue: string): void => {
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

    const options = type.values.map((enumValue) => ({
        value: String(enumValue.value),
        label: formatIdentifier(String(enumValue.identifier ?? enumValue.value))
    }));

    return <Select value={value ?? ""} options={options} onChange={handleChange} placeholder="Select..." />;
}
