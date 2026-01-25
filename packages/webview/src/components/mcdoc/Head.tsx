import type { JSX } from "preact";
import type { NodeProps } from "@/services/McdocHelpers.ts";
import { getItemType, isFixedList, isListOrArray } from "@/services/McdocHelpers.ts";
import { AnyHead } from "./heads/AnyHead.tsx";
import { BooleanHead } from "./heads/BooleanHead.tsx";
import { EnumHead } from "./heads/EnumHead.tsx";
import { ListHead } from "./heads/ListHead.tsx";
import { NumericHead } from "./heads/NumericHead.tsx";
import { StringHead } from "./heads/StringHead.tsx";
import { StructHead } from "./heads/StructHead.tsx";
import { TupleHead } from "./heads/TupleHead.tsx";
import { UnionHead } from "./heads/UnionHead.tsx";

// Misode: McdocRenderer.tsx:58-93
export function Head({ type, node, ctx, optional }: NodeProps): JSX.Element | null {
    switch (type.kind) {
        case "string":
            return <StringHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "byte":
        case "short":
        case "int":
        case "long":
        case "float":
        case "double":
            return <NumericHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "boolean":
            return <BooleanHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "enum":
            return <EnumHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "union":
            return <UnionHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "struct":
            return <StructHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "list":
        case "byte_array":
        case "int_array":
        case "long_array":
            // Misode: McdocRenderer.tsx:77-81 - Fixed length arrays are treated as tuples (e.g., UUID)
            if (isListOrArray(type) && isFixedList(type)) {
                const tupleType = {
                    kind: "tuple" as const,
                    items: [...Array(type.lengthRange.min)].map(() => getItemType(type)),
                    attributes: type.attributes
                };
                return <TupleHead type={tupleType} node={node} ctx={ctx} optional={optional} />;
            }
            return <ListHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "tuple":
            return <TupleHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "literal":
            return <UnionHead type={{ kind: "union", members: [type] }} node={node} ctx={ctx} optional={optional} />;

        case "any":
        case "unsafe":
            return <AnyHead type={type} node={node} ctx={ctx} optional={optional} />;

        default:
            return null;
    }
}
