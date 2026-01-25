import type { RefObject } from "preact";
import { useRef, useState } from "preact/hooks";

export type DropdownPosition = "top" | "bottom";

interface UseDropdownPositionResult<T extends HTMLElement, D extends HTMLElement> {
    containerRef: RefObject<T>;
    dropdownRef: RefObject<D>;
    position: DropdownPosition;
    updatePosition: () => void;
}

export function useDropdownPosition<T extends HTMLElement, D extends HTMLElement>(): UseDropdownPositionResult<T, D> {
    const containerRef = useRef<T>(null);
    const dropdownRef = useRef<D>(null);
    const [position, setPosition] = useState<DropdownPosition>("bottom");

    const updatePosition = (): void => {
        if (!containerRef.current || !dropdownRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;

        setPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    };

    return { containerRef, dropdownRef, position, updatePosition };
}
