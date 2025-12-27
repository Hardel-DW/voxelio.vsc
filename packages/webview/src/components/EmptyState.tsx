import type { ComponentChildren, JSX } from "preact";

interface EmptyStateProps {
    icon: ComponentChildren;
    title: string;
    description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps): JSX.Element {
    return (
        <div class="empty-state">
            <div class="empty-state-icon">
                {icon}
            </div>
            <h3 class="empty-state-title">{title}</h3>
            {description && <p class="empty-state-description">{description}</p>}
        </div>
    );
}
