import { formatIdentifier } from "@/services/McdocHelpers.ts";

interface KeyProps {
    label: string;
    doc?: string;
    raw?: boolean;
}

export function Key({ label, doc, raw }: KeyProps): React.ReactNode {
    return <span className={doc ? "node-key has-doc" : "node-key"}>{raw ? label : formatIdentifier(label)}</span>;
}
