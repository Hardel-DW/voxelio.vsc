import { useState } from "react";
import { Range } from "@spyglassmc/core";
import type { JsonObjectNode, JsonPairNode } from "@spyglassmc/json";
import { Octicon } from "@/components/Icons.tsx";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import { getCategory, type SimplifiedMcdocField, simplifyType } from "@/services/McdocHelpers.ts";
import { StructBody } from "./StructBody.tsx";

// Misode: McdocRenderer.tsx:707-766
interface DynamicFieldProps {
    pair: JsonPairNode;
    index: number;
    field: SimplifiedMcdocField;
    fieldKey: string;
    node: JsonObjectNode;
    ctx: McdocContext;
}

export function DynamicField({ pair, index, field, fieldKey, node, ctx }: DynamicFieldProps): React.ReactNode {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const child = pair.value;
    const childType = simplifyType(field.type, ctx, { key: pair.key, parent: node });
    const category = getCategory(field.type);
    const canToggle = childType.kind === "struct" || childType.kind === "list" || childType.kind === "union";

    const makeFieldEdit: MakeEdit = (edit) => {
        ctx.makeEdit(() => {
            const newChild = edit(child?.range ?? Range.create(pair.range.end));
            if (newChild === undefined) {
                node.children.splice(index, 1);
            } else {
                node.children[index] = { type: "pair", range: pair.range, key: pair.key, value: newChild };
            }
            return node;
        });
    };

    const handleRemove = (): void => {
        ctx.makeEdit(() => {
            node.children.splice(index, 1);
            return node;
        });
    };

    const fieldCtx: McdocContext = { ...ctx, makeEdit: makeFieldEdit };

    // Misode: McdocRenderer.tsx:760-764 - use node-body-flat for struct with category
    const renderBody = (): React.ReactNode => {
        if (isCollapsed) return null;
        if (childType.kind === "struct" && category) {
            return (
                <div className="node-body-flat">
                    <StructBody type={childType} node={child} ctx={fieldCtx} />
                </div>
            );
        }
        return <Body type={childType} node={child} ctx={fieldCtx} />;
    };

    return (
        <div className="node" data-category={category}>
            <div className="node-header">
                {canToggle && (
                    <button type="button" className="toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? Octicon.chevron_right : Octicon.chevron_down}
                    </button>
                )}
                <button type="button" className="remove" onClick={handleRemove}>
                    {Octicon.trashcan}
                </button>
                <Key label={fieldKey} raw />
                {!isCollapsed && <Head type={childType} node={child} ctx={fieldCtx} />}
            </div>
            {renderBody()}
        </div>
    );
}
