import type { JsonNode } from "@spyglassmc/json";
import { JsonArrayNode } from "@spyglassmc/json";
import type { TupleType } from "@spyglassmc/mcdoc";
import { Body } from "@/components/mcdoc/Body.tsx";
import { Errors } from "@/components/mcdoc/ErrorIndicator.tsx";
import { Head } from "@/components/mcdoc/Head.tsx";
import { Key } from "@/components/mcdoc/Key.tsx";
import type { MakeEdit, McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { simplifyType } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:1080-1092
export function TupleBody({
    type,
    node,
    ctx
}: {
    type: TupleType;
    node: JsonArrayNode;
    ctx: McdocContext;
    optional?: boolean;
}): React.ReactNode {
    if (!JsonArrayNode.is(node)) {
        return null;
    }

    return (
        <>
            {type.items.map((itemType, index) => {
                const item = node.children[index];
                const child = item?.value;
                const childType = simplifyType(itemType, ctx);
                return <TupleBodyItem key={index.toString()} child={child} childType={childType} index={index} node={node} ctx={ctx} />;
            })}
        </>
    );
}

// Misode: McdocRenderer.tsx:1100-1128
interface TupleBodyItemProps {
    child: JsonNode | undefined;
    childType: SimplifiedMcdocType;
    index: number;
    node: JsonArrayNode;
    ctx: McdocContext;
}

function TupleBodyItem({ child, childType, index, node, ctx }: TupleBodyItemProps): React.ReactNode {
    const makeItemEdit: MakeEdit = (edit) => {
        ctx.makeEdit(() => {
            const newChild = edit(child?.range ?? node.range);
            if (newChild === undefined) {
                return node;
            }
            node.children[index] = { type: "item", range: newChild.range, value: newChild, children: [newChild] };
            return node;
        });
    };

    const itemCtx: McdocContext = { ...ctx, makeEdit: makeItemEdit };

    return (
        <div className="node">
            <div className="node-header">
                <Errors type={childType} node={child} ctx={ctx} />
                <Key label="Entry" />
                <Head type={childType} node={child} ctx={itemCtx} />
            </div>
            <Body type={childType} node={child} ctx={itemCtx} />
        </div>
    );
}
