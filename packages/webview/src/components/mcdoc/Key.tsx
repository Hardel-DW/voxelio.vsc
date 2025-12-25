import { formatIdentifier } from "@/services/McdocHelpers.ts";

interface KeyProps {
    label: string;
    doc?: string;
    raw?: boolean;
}

export function Key({ label, doc, raw }: KeyProps): React.ReactNode {
    return (
        <label>
            <span className={doc ? "underline decoration-dotted hover:decoration-solid" : ""}>
                {raw ? label : formatIdentifier(label)}
            </span>
        </label>
    );
}
