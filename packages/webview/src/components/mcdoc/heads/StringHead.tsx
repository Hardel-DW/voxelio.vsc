import { Range, Source, string } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import { getValues } from "@spyglassmc/mcdoc/lib/runtime/completer/index.js";
import { useId } from "react";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import { formatIdentifier, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type StringType = Extract<SimplifiedMcdocType, { kind: "string" }>;

// Misode: McdocRenderer.tsx:166-234
export function StringHead({ type, node, ctx, optional, excludeStrings }: NodeProps<StringType>): React.ReactNode {
    const stringNode = JsonStringNode.is(node) ? node : undefined;
    const nodeValue = stringNode?.value ?? "";
    const datalistId = useId();

    // Misode: McdocRenderer.tsx:189-195
    const completions = getCompletions(type, stringNode, ctx, excludeStrings);
    const isSelect = completions.length > 0 && completions.length <= 20;

    const handleChange = (value: string): void => {
        if (nodeValue === value) return;
        ctx.makeEdit((range) => createStringNode(value, range, optional, ctx));
    };

    // Misode: McdocRenderer.tsx:215-229
    if (isSelect) {
        return (
            <select value={nodeValue} onChange={(e) => handleChange(e.target.value)}>
                {(nodeValue === "" || optional) && <option value="">--</option>}
                {nodeValue && !completions.some((c) => c.value === nodeValue) && <option value={nodeValue}>{nodeValue}</option>}
                {completions.map((c) => (
                    <option key={c.value} value={c.value}>
                        {formatIdentifier(c.value)}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <>
            {completions.length > 0 && (
                <datalist id={datalistId}>
                    {completions.map((c) => (
                        <option key={c.value} value={c.value} />
                    ))}
                </datalist>
            )}
            <input
                type="text"
                value={nodeValue}
                onChange={(e) => handleChange(e.target.value)}
                list={completions.length > 0 ? datalistId : undefined}
            />
        </>
    );
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
    ctx: NodeProps<StringType>["ctx"]
): JsonStringNode | undefined {
    if (value.length === 0 && optional) return undefined;
    const valueMap = [{ inner: Range.create(0), outer: Range.create(range.start) }];
    const source = new Source(JSON.stringify(value), valueMap);
    const stringNode = string(JsonStringOptions)(source, ctx);
    return { ...stringNode, type: "json:string" } as JsonStringNode;
}
