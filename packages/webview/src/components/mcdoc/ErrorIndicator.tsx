interface ErrorIndicatorProps {
    message: string;
}

export function ErrorIndicator({ message }: ErrorIndicatorProps): React.ReactNode {
    return (
        <div className="error-indicator">
            <span>!</span>
            <div className="error-tooltip">{message}</div>
        </div>
    );
}
