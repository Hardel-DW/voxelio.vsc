import type { SchemaNode } from "@/types.ts";
import { BooleanInput } from "@/nodes/inputs/BooleanInput.tsx";
import { EnumInput } from "@/nodes/inputs/EnumInput.tsx";
import { NumberInput } from "@/nodes/inputs/NumberInput.tsx";
import { ReferenceInput } from "@/nodes/inputs/ReferenceInput.tsx";
import { StringInput } from "@/nodes/inputs/StringInput.tsx";

interface NodeInputProps {
    readonly node: SchemaNode;
    readonly path: readonly (string | number)[];
}

export function NodeInput({ node, path }: NodeInputProps) {
    switch (node.kind) {
        case "string":
            return <StringInput node={node} path={path} />;
        case "number":
            return <NumberInput node={node} path={path} />;
        case "boolean":
            return <BooleanInput node={node} path={path} />;
        case "enum":
            return <EnumInput node={node} path={path} />;
        case "reference":
            return <ReferenceInput node={node} path={path} />;
        default:
            return null;
    }
}
