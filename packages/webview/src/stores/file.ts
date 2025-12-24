import type { DocAndNode, LanguageError } from "@spyglassmc/core";
import { create } from "zustand";

interface FileState {
    realUri: string | null;
    virtualUri: string | null;
    docAndNode: DocAndNode | null;
    errors: LanguageError[];
    setFile: (realUri: string, virtualUri: string, docAndNode: DocAndNode) => void;
    setErrors: (errors: LanguageError[]) => void;
    clear: () => void;
}

export const useFileStore = create<FileState>((set) => ({
    realUri: null,
    virtualUri: null,
    docAndNode: null,
    errors: [],
    setFile: (realUri, virtualUri, docAndNode) => set({ realUri, virtualUri, docAndNode, errors: [] }),
    setErrors: (errors) => set({ errors }),
    clear: () => set({ realUri: null, virtualUri: null, docAndNode: null, errors: [] })
}));
