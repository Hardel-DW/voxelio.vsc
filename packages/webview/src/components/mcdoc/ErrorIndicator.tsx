import type { AstNode, LanguageError } from "@spyglassmc/core";
import { Range as RangeUtil } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";
import type { McdocContext } from "@/services/McdocContext.ts";
import type { SimplifiedMcdocType } from "@/services/McdocHelpers.ts";
import { selectUnionMember } from "@/services/McdocHelpers.ts";

// Misode: McdocRenderer.tsx:1210-1248
interface ErrorsProps {
    type: SimplifiedMcdocType;
    node: AstNode | undefined;
    ctx: McdocContext;
}

// Misode: McdocRenderer.tsx:1215-1236
export function Errors({ type, node, ctx }: ErrorsProps): JSX.Element | null {
    if (node === undefined) {
        return null;
    }

    const errors = filterErrors(type, node, ctx);
    return (
        <>
            {errors.map((e, i) => (
                <ErrorIndicator key={`${e.range.start}-${i}`} error={e} />
            ))}
        </>
    );
}

function filterErrors(type: SimplifiedMcdocType, node: AstNode, ctx: McdocContext): LanguageError[] {
    const allErrors = ctx.err.errors;
    const nodeErrors = allErrors.filter((e) => RangeUtil.containsRange(node.range, e.range, true));
    const directErrors = nodeErrors.filter(
        (e) => !node.children?.some((c) => (c.type === "item" || c.type === "pair") && RangeUtil.containsRange(c.range, e.range, true))
    );

    const filtered = directErrors.filter((e) => {
        if (RangeUtil.length(e.range) !== 1) return true;
        if (type.kind === "struct") return false;
        if (type.kind === "union") {
            const selected = selectUnionMember(type, node as JsonNode);
            if (selected?.kind === "struct") return false;
        }
        return true;
    });

    const hasError = filtered.some((e) => e.severity === 3);
    return hasError ? filtered.filter((e) => e.severity === 3) : filtered;
}

// Misode: McdocRenderer.tsx:1238-1248
interface ErrorIndicatorProps {
    error: LanguageError;
}

export function ErrorIndicator({ error }: ErrorIndicatorProps): JSX.Element | null {
    const isWarning = error.severity === 2;
    const message = error.message.replace(/ \(rule: [a-zA-Z]+\)$/, "");

    return (
        <span class={`node-icon ${isWarning ? "node-warning" : "node-error"}`}>
            {Octicon.issue_opened}
            <span class="icon-popup">{message}</span>
        </span>
    );
}

interface SimpleErrorProps {
    message: string;
}

export function SimpleError({ message }: SimpleErrorProps): JSX.Element | null {
    return (
        <span class="node-icon node-error">
            {Octicon.issue_opened}
            <span class="icon-popup">{message}</span>
        </span>
    );
}
