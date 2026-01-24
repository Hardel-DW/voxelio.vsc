import { Range, Source, string } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import { getValues } from "@spyglassmc/mcdoc/lib/runtime/completer/index.js";
import type { JSX } from "preact";
import { Autocomplete } from "@/components/Autocomplete.tsx";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import { Select } from "@/components/Select.tsx";
import { formatIdentifier, getIdRegistry, isSelectRegistry, type SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { generateColor, intToHexRgb } from "@/services/Utils.ts";

type StringType = Extract<SimplifiedMcdocType, { kind: "string" }>;

// Misode: McdocRenderer.tsx:143-234
export function StringHead({ type, node, ctx, optional, excludeStrings }: NodeProps<StringType>): JSX.Element | null {
    const stringNode = JsonStringNode.is(node) ? node : undefined;
    const nodeValue = stringNode?.value ?? "";

    // Misode: McdocRenderer.tsx:155-164
    const idRegistry = getIdRegistry(type);
    const isSelect = idRegistry !== undefined && isSelectRegistry(idRegistry);

    // Misode: McdocRenderer.tsx:197-199
    const colorAttr = type.attributes?.find((a) => a.name === "color")?.value;
    const colorKind = colorAttr?.kind === "literal" && colorAttr.value.kind === "string" ? colorAttr.value.value : undefined;

    // Misode: McdocRenderer.tsx:189-195
    const completions = getCompletions(type, stringNode, ctx, excludeStrings);

    const handleChange = (value: string): void => {
        if (nodeValue === value) return;
        ctx.makeEdit((range) => createStringNode(value, range, optional, isSelect, ctx));
    };

    // Misode: McdocRenderer.tsx:201-207
    const handleColorChange = (e: JSX.TargetedEvent<HTMLInputElement>): void => {
        handleChange(e.currentTarget.value);
    };

    const handleRandomColor = (): void => {
        handleChange(intToHexRgb(generateColor()));
    };

    // Misode: McdocRenderer.tsx:215-220 - Select for registry types
    if (isSelect) {
        const options = completions.map((c) => ({ value: c.value, label: formatIdentifier(c.value) }));
        if (nodeValue && !completions.some((c) => c.value === nodeValue)) {
            options.unshift({ value: nodeValue, label: nodeValue });
        }
        const placeholder = nodeValue === "" || optional ? "-- unset --" : undefined;
        return <Select value={nodeValue} options={options} onChange={(v) => handleChange(v)} placeholder={placeholder} />;
    }

    // Misode: McdocRenderer.tsx:221-225 - Input with datalist for autocomplete
    if (completions.length > 0) {
        const options = completions.map((c) => ({ value: c.value }));
        return <Autocomplete value={nodeValue} options={options} onChange={handleChange} />;
    }

    // Misode: McdocRenderer.tsx:209-214
    if (colorKind === "hex_rgb") {
        return (
            <>
                <input type="text" value={nodeValue} onInput={(e) => handleChange(e.currentTarget.value)} />
                <input class="short-input" type="color" value={nodeValue || "#000000"} onInput={handleColorChange} />
                <button type="button" onClick={handleRandomColor}>
                    {Octicon.random}
                </button>
            </>
        );
    }

    // Misode: McdocRenderer.tsx:225 - Textarea with field-sizing for multiline support
    return <textarea rows={1} value={nodeValue} onInput={(e) => handleChange(e.currentTarget.value)} />;
}

function getCompletions(type: StringType, node: JsonStringNode | undefined, ctx: NodeProps<StringType>["ctx"], excludeStrings?: string[]) {
    const offset = node && JsonStringNode.is(node) ? node.range.start : 0;
    const values = getValues(type, { ...ctx, offset })
        .filter((c): c is { kind: "string"; value: string } => c.kind === "string" && c.value !== "THIS")
        .filter((c) => !excludeStrings?.includes(c.value));
    values.sort((a, b) => a.value.localeCompare(b.value));
    return values;
}

// Misode: McdocRenderer.tsx:172-173
function createStringNode(
    value: string,
    range: Range,
    optional: boolean | undefined,
    isSelect: boolean,
    ctx: NodeProps<StringType>["ctx"]
): JsonStringNode | undefined {
    if ((value.length === 0 && optional) || (isSelect && value === "")) return undefined;
    const valueMap = [{ inner: Range.create(0), outer: Range.create(range.start) }];
    const source = new Source(JSON.stringify(value), valueMap);
    const stringNode = string(JsonStringOptions)(source, ctx);
    return { ...stringNode, type: "json:string" } as JsonStringNode;
}
