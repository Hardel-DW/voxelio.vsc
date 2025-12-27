import type { JSX } from "preact";
import { formatIdentifier } from "@/services/McdocHelpers.ts";

interface KeyProps {
    label: string;
    doc?: string;
    raw?: boolean;
}

export function Key({ label, doc, raw }: KeyProps): JSX.Element | null {
    const displayLabel = raw ? label : formatIdentifier(label);

    if (doc) {
        return (
            <span class="node-key has-doc">
                {displayLabel}
                <div class="node-doc">{doc}</div>
            </span>
        );
    }

    return <span class="node-key">{displayLabel}</span>;
}
