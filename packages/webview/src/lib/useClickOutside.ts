import type { RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";

type Handler = () => void;

export function useClickOutside<T extends HTMLElement>(handler: Handler, externalRef?: RefObject<T>): RefObject<T> {
    const internalRef = useRef<T>(null);
    const ref = externalRef ?? internalRef;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;
            if (ref.current && !ref.current.contains(target)) {
                handler();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return ref;
}
