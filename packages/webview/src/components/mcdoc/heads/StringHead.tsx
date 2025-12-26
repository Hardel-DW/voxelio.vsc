import { Range, Source, string } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import { getValues } from "@spyglassmc/mcdoc/lib/runtime/completer/index.js";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import { formatIdentifier, getIdRegistry, isSelectRegistry, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { Autocomplete } from "@/components/Autocomplete.tsx";

type StringType = Extract<SimplifiedMcdocType, { kind: "string" }>;

// Misode: McdocRenderer.tsx:143-234
export function StringHead({ type, node, ctx, optional, excludeStrings }: NodeProps<StringType>): React.ReactNode {
    const stringNode = JsonStringNode.is(node) ? node : undefined;
    const nodeValue = stringNode?.value ?? "";

    // Misode: McdocRenderer.tsx:155-164
    const idRegistry = getIdRegistry(type);
    const isSelect = idRegistry !== undefined && isSelectRegistry(idRegistry);

    // Misode: McdocRenderer.tsx:189-195
    const completions = getCompletions(type, stringNode, ctx, excludeStrings);

    const handleChange = (value: string): void => {
        if (nodeValue === value) return;
        ctx.makeEdit((range) => createStringNode(value, range, optional, isSelect, ctx));
    };

    // Misode: McdocRenderer.tsx:215-220 - Select for registry types
    if (isSelect) {
        return (
            <select value={nodeValue || "__unset__"} onChange={(e) => handleChange(e.target.value === "__unset__" ? "" : e.target.value)}>
                {(nodeValue === "" || optional) && <option value="__unset__">-- unset --</option>}
                {nodeValue && !completions.some((c) => c.value === nodeValue) && <option value={nodeValue}>{nodeValue}</option>}
                {completions.map((c) => (
                    <option key={c.value} value={c.value}>
                        {formatIdentifier(c.value)}
                    </option>
                ))}
            </select>
        );
    }

    // Misode: McdocRenderer.tsx:221-225 - Input with datalist for autocomplete
    if (completions.length > 0) {
        const options = completions.map((c) => ({ value: c.value }));
        return <Autocomplete value={nodeValue} options={options} onChange={handleChange} />;
    }

    // Misode: McdocRenderer.tsx:225 - Plain input
    return <input type="text" value={nodeValue} onChange={(e) => handleChange(e.target.value)} />;
}

// Misode: McdocRenderer.tsx:189-195
function getCompletions(type: StringType, node: JsonStringNode | undefined, ctx: NodeProps<StringType>["ctx"], excludeStrings?: string[]) {
    const offset = node && JsonStringNode.is(node) ? node.range.start : 0;
    const values = getValues(type, { ...ctx, offset })
        .filter((c): c is { kind: "string"; value: string } => c.kind === "string" && c.value !== "THIS")
        .filter((c) => !excludeStrings?.includes(c.value));
    values.sort((a, b) => a.value.localeCompare(b.value));
    return values;
}

function createStringNode(
    value: string,
    range: Range,
    optional: boolean | undefined,
    isSelect: boolean,
    ctx: NodeProps<StringType>["ctx"]
): JsonStringNode | undefined {
    // Misode: McdocRenderer.tsx:172-173
    if ((value.length === 0 && optional) || (isSelect && value === "")) return undefined;
    const valueMap = [{ inner: Range.create(0), outer: Range.create(range.start) }];
    const source = new Source(JSON.stringify(value), valueMap);
    const stringNode = string(JsonStringOptions)(source, ctx);
    return { ...stringNode, type: "json:string" } as JsonStringNode;
}
