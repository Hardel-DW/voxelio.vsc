import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";

interface WikiLinkProps {
    url: string;
    label: string;
}

export function WikiLink({ url, label }: WikiLinkProps): JSX.Element {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" class="wiki-link">
            {Octicon.link_external}
            <span>Wiki - {label}</span>
        </a>
    );
}
