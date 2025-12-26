import type { AstNode, LanguageError } from "@spyglassmc/core";
import { Range as RangeUtil } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
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
export function Errors({ type, node, ctx }: ErrorsProps): React.ReactNode {
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

    // Get all errors inside the current node
    const nodeErrors = allErrors.filter((e) => RangeUtil.containsRange(node.range, e.range, true));

    // Unless they are inside a child node (will be shown there)
    const directErrors = nodeErrors.filter(
        (e) => !node.children?.some((c) => (c.type === "item" || c.type === "pair") && RangeUtil.containsRange(c.range, e.range, true))
    );

    // Filter out "Missing key" errors for structs (handled separately)
    const filtered = directErrors.filter((e) => {
        if (RangeUtil.length(e.range) !== 1) return true;
        if (type.kind === "struct") return false;
        if (type.kind === "union") {
            const selected = selectUnionMember(type, node as JsonNode);
            if (selected?.kind === "struct") return false;
        }
        return true;
    });

    // Hide warnings if there are errors
    const hasError = filtered.some((e) => e.severity === 3);
    return hasError ? filtered.filter((e) => e.severity === 3) : filtered;
}

// Misode: McdocRenderer.tsx:1238-1248
interface ErrorIndicatorProps {
    error: LanguageError;
}

export function ErrorIndicator({ error }: ErrorIndicatorProps): React.ReactNode {
    const isWarning = error.severity === 2;
    const message = error.message.replace(/ \(rule: [a-zA-Z]+\)$/, "");

    return (
        <span className={`node-icon ${isWarning ? "node-warning" : "node-error"}`}>
            {Octicon.issue_opened}
            <span className="icon-popup">{message}</span>
        </span>
    );
}

// Simple error indicator for missing required keys (no LanguageError)
interface SimpleErrorProps {
    message: string;
}

export function SimpleError({ message }: SimpleErrorProps): React.ReactNode {
    return (
        <span className="node-icon node-error">
            {Octicon.issue_opened}
            <span className="icon-popup">{message}</span>
        </span>
    );
}
