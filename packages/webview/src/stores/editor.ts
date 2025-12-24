import { create } from "zustand";
import type { VersionConfig } from "@/types.ts";

interface EditorState {
    packFormat: number | null;
    version: VersionConfig | null;
    registries: Map<string, string[]>;
    setPackFormat: (format: number) => void;
    setVersion: (version: VersionConfig) => void;
    setRegistries: (registries: Record<string, string[]>) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    packFormat: null,
    version: null,
    registries: new Map(),
    setPackFormat: (format) => set({ packFormat: format }),
    setVersion: (version) => set({ version }),
    setRegistries: (registries) => set({ registries: new Map(Object.entries(registries)) })
}));
