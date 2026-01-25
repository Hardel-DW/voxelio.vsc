import type { JsonNode } from "@spyglassmc/json";
import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Select } from "@/components/Select.tsx";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { formatIdentifier, getDefault } from "@/services/McdocHelpers.ts";
import { Head } from "../Head.tsx";

const ANY_TYPES: SimplifiedMcdocType[] = [
    { kind: "boolean" },
    { kind: "double" },
    { kind: "string" },
    { kind: "list", item: { kind: "any" } },
    { kind: "struct", fields: [{ kind: "pair", key: { kind: "string" }, type: { kind: "any" } }] }
];

export function selectAnyType(node: JsonNode | undefined): SimplifiedMcdocType | undefined {
    switch (node?.type) {
        case "json:boolean":
            return ANY_TYPES[0];
        case "json:number":
            return ANY_TYPES[1];
        case "json:string":
            return ANY_TYPES[2];
        case "json:array":
            return ANY_TYPES[3];
        case "json:object":
            return ANY_TYPES[4];
        default:
            return undefined;
    }
}

export function AnyHead({ node, ctx, optional }: NodeProps): JSX.Element {
    const selectedType = selectAnyType(node);

    const handleSelect = (newValue: string): void => {
        ctx.makeEdit((range) => {
            const newSelected = ANY_TYPES.find((t) => t.kind === newValue);
            if (!newSelected) return undefined;
            return getDefault(newSelected, range, ctx);
        });
    };

    const options = ANY_TYPES.map((t) => ({ value: t.kind, label: formatIdentifier(t.kind) }));
    const placeholder = !selectedType || optional ? "-- unset --" : undefined;

    return (
        <>
            <Select value={selectedType?.kind ?? ""} options={options} onChange={handleSelect} placeholder={placeholder} />
            {selectedType && <Head type={selectedType} node={node} ctx={ctx} />}
        </>
    );
}
