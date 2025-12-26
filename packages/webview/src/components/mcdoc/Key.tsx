import { formatIdentifier } from "@/services/McdocHelpers.ts";

interface KeyProps {
    label: string;
    doc?: string;
    raw?: boolean;
}

export function Key({ label, doc, raw }: KeyProps): React.ReactNode {
    const displayLabel = raw ? label : formatIdentifier(label);

    if (doc) {
        return (
            <span className="node-key has-doc">
                {displayLabel}
                <div className="node-doc">{doc}</div>
            </span>
        );
    }

    return <span className="node-key">{displayLabel}</span>;
}
