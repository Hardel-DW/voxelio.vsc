import type { ColorSettings } from "@voxel/shared";

export function applyColorSettings(colors: ColorSettings): void {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-text", colors.text);
    root.style.setProperty("--color-add", colors.add);
    root.style.setProperty("--color-remove", colors.remove);
    root.style.setProperty("--color-selected", colors.selected);
    root.style.setProperty("--color-warning", colors.warning);
    root.style.setProperty("--color-error", colors.error);
    root.style.setProperty("--color-predicate", colors.predicate);
    root.style.setProperty("--color-function", colors.function);
    root.style.setProperty("--color-pool", colors.pool);
}
