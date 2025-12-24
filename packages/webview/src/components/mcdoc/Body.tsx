import { ListBody } from "./bodies/ListBody.tsx";
import { StructBody } from "./bodies/StructBody.tsx";
import { UnionBody } from "./bodies/UnionBody.tsx";
import type { NodeProps } from "./types.ts";

export function Body({ type, node, ctx, optional }: NodeProps): React.ReactNode {
    switch (type.kind) {
        case "struct":
            return <StructBody type={type} node={node} ctx={ctx} optional={optional} />;

        case "list":
        case "byte_array":
        case "int_array":
        case "long_array":
        case "tuple":
            return <ListBody type={type} node={node} ctx={ctx} optional={optional} />;

        case "union":
            return <UnionBody type={type} node={node} ctx={ctx} optional={optional} />;

        default:
            return null;
    }
}
