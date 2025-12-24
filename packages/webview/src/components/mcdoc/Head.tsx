import { BooleanHead } from "./heads/BooleanHead.tsx";
import { EnumHead } from "./heads/EnumHead.tsx";
import { ListHead } from "./heads/ListHead.tsx";
import { NumericHead } from "./heads/NumericHead.tsx";
import { StringHead } from "./heads/StringHead.tsx";
import { StructHead } from "./heads/StructHead.tsx";
import { UnionHead } from "./heads/UnionHead.tsx";
import type { NodeProps } from "./types.ts";

export function Head({ type, node, ctx, optional }: NodeProps): React.ReactNode {
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
            return <ListHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "tuple":
            return <ListHead type={type} node={node} ctx={ctx} optional={optional} />;

        case "literal":
            return <span className="literal">{String(type.value.value)}</span>;

        case "any":
        case "unsafe":
            return <span className="any">any</span>;

        default:
            return null;
    }
}
