import type { JSX } from "preact";
import { Octicon } from "@/components/Icons.tsx";

export function Footer(): JSX.Element {
    return (
        <footer class="editor-footer">
            <a href="https://discord.gg/8z3tkQhay7" target="_blank" rel="noopener noreferrer" class="footer-link">
                {Octicon.discord}
                <span>Discord</span>
            </a>
            <a href="https://www.patreon.com/hardel" target="_blank" rel="noopener noreferrer" class="footer-link footer-patreon">
                {Octicon.heart}
                <span>Support</span>
            </a>
        </footer>
    );
}
