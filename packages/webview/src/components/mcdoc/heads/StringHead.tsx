import { Range, Source, string } from "@spyglassmc/core";
import { JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";

type StringType = Extract<SimplifiedMcdocType, { kind: "string" }>;

// Misode: McdocRenderer.tsx:166-234
export function StringHead({ node, ctx, optional }: NodeProps<StringType>): React.ReactNode {
    const nodeValue = JsonStringNode.is(node) ? node.value : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = e.target.value;
        if (nodeValue === newValue) return;

        ctx.makeEdit((range) => {
            if (newValue.length === 0 && optional) {
                return undefined;
            }
            const valueMap = [{ inner: Range.create(0), outer: Range.create(range.start) }];
            const source = new Source(JSON.stringify(newValue), valueMap);
            const stringNode = string(JsonStringOptions)(source, ctx);
            return { ...stringNode, type: "json:string" } as JsonStringNode;
        });
    };

    return <input type="text" value={nodeValue} onChange={handleChange} />;
}
