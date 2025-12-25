import type { PairNode } from "@spyglassmc/core";
import { Range } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonObjectNode, type JsonStringNode } from "@spyglassmc/json";
import type { LiteralType } from "@spyglassmc/mcdoc";
import type { NodeProps } from "@/components/mcdoc/types.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { simplifyType } from "@/services/McdocHelpers.ts";
import { DynamicField } from "./DynamicField.tsx";
import { DynamicKey } from "./DynamicKey.tsx";
import { StaticField } from "./StaticField.tsx";

type StructType = Extract<SimplifiedMcdocType, { kind: "struct" }>;

// Misode: McdocRenderer.tsx:493-556
export function StructBody({ type: outerType, node, ctx }: NodeProps<StructType>): React.ReactNode {
    if (!JsonObjectNode.is(node)) return null;

    const type = node.typeDef?.kind === "struct" ? node.typeDef : outerType;
    const staticFields = type.fields.filter((f) => f.key.kind === "literal");
    const dynamicFields = type.fields.filter((f) => f.key.kind !== "literal");
    const staticChildPairs: PairNode<JsonStringNode, JsonNode>[] = [];

    return (
        <>
            {/* Misode: McdocRenderer.tsx:518-526 */}
            {staticFields.map((field) => {
                const key = (field.key as LiteralType).value.value.toString();
                const index = node.children.findIndex((p) => p.key?.value === key);
                const pair = index === -1 ? undefined : node.children[index];
                if (pair) staticChildPairs.push(pair);
                return (
                    <StaticField
                        key={key}
                        pair={pair}
                        index={index}
                        field={field}
                        fieldKey={key}
                        staticFields={staticFields}
                        node={node}
                        ctx={ctx}
                    />
                );
            })}

            {/* Misode: McdocRenderer.tsx:527-538 */}
            {dynamicFields.map((field) => {
                if (field.key.kind === "any" && field.type.kind === "any") return null;
                const keyType = simplifyType(field.key, ctx);
                const fieldId = `__dynamic_${field.key.kind}_${field.type.kind}__`;
                return (
                    <div key={fieldId} className="node">
                        <div className="node-header">
                            <DynamicKey keyType={keyType} valueType={field.type} parent={node} ctx={ctx} />
                        </div>
                    </div>
                );
            })}

            {/* Misode: McdocRenderer.tsx:539-554 */}
            {node.children.map((pair, index) => {
                const key = pair.key?.value;
                if (staticChildPairs.includes(pair) || !key) return null;
                if (pair.value && Range.length(pair.value.range) === 0) return null;
                const field = dynamicFields[key.startsWith("!") ? 1 : 0];
                if (!field || (field.key.kind === "any" && field.type.kind === "any")) return null;
                return <DynamicField key={key} pair={pair} index={index} field={field} fieldKey={key} node={node} ctx={ctx} />;
            })}
        </>
    );
}
