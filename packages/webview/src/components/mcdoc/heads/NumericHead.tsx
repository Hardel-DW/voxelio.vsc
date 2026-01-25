import type { FloatNode, LongNode } from "@spyglassmc/core";
import { JsonNumberNode } from "@spyglassmc/json";
import type { SimplifiedMcdocType } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { generateColor, intToHexRgb, randomInt, randomSeed } from "@/services/Utils.ts";

type NumericType = Extract<SimplifiedMcdocType, { kind: "byte" | "short" | "int" | "long" | "float" | "double" }>;

// Misode: McdocRenderer.tsx:294-359
export function NumericHead({ type, node, ctx }: NodeProps<NumericType>): JSX.Element | null {
    const nodeValue = node && JsonNumberNode.is(node) ? Number(node.value.value) : undefined;

    // Misode: McdocRenderer.tsx:333-334
    const colorAttr = type.attributes?.find((a) => a.name === "color")?.value;
    const colorKind = colorAttr?.kind === "literal" && colorAttr.value.kind === "string" ? colorAttr.value.value : undefined;
    const hasRandom = type.attributes?.some((a) => a.name === "random");

    const updateValue = (number: number | bigint | undefined): void => {
        if (number === nodeValue) return;
        ctx.makeEdit((range) => {
            if (number === undefined) return undefined;
            const newValue: FloatNode | LongNode =
                typeof number === "bigint" || Number.isInteger(number)
                    ? { type: "long", range, value: typeof number === "number" ? BigInt(number) : number }
                    : { type: "float", range, value: Number(number) };
            const newNode: JsonNumberNode = { type: "json:number", range, value: newValue, children: [newValue] };
            newValue.parent = newNode;
            return newNode;
        });
    };

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>): void => {
        const value = e.currentTarget.value;
        const number = value.length === 0 ? undefined : Number(value);
        if (number !== undefined && Number.isNaN(number)) return;
        updateValue(number);
    };

    // Misode: McdocRenderer.tsx:336-338
    const handleColorChange = (e: JSX.TargetedEvent<HTMLInputElement>): void => {
        updateValue(Number.parseInt(e.currentTarget.value.slice(1), 16));
    };

    // Misode: McdocRenderer.tsx:340-342
    const handleRandomColor = (): void => {
        updateValue(generateColor());
    };

    // Misode: McdocRenderer.tsx:346-348
    const handleRandom = (): void => {
        updateValue(type.kind === "long" ? randomSeed() : randomInt());
    };

    return (
        <>
            <input class="short-input" type="number" value={nodeValue ?? ""} onInput={handleChange} />
            {colorKind && (
                <>
                    <input class="short-input" type="color" value={intToHexRgb(nodeValue)} onInput={handleColorChange} />
                    <button type="button" onClick={handleRandomColor}>
                        {Octicon.random}
                    </button>
                </>
            )}
            {hasRandom && (
                <button type="button" onClick={handleRandom}>
                    {Octicon.random}
                </button>
            )}
        </>
    );
}
