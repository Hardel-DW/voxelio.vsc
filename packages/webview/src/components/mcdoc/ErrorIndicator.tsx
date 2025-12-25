import { Octicon } from "@/components/Icons.tsx";

interface ErrorIndicatorProps {
    message: string;
}

export function ErrorIndicator({ message }: ErrorIndicatorProps): React.ReactNode {
    return (
        <div className="error-indicator">
            {Octicon.warning}
            <div className="error-tooltip">{message}</div>
        </div>
    );
}
