import { create } from "zustand";

interface EditorState {
    packFormat: number | null;
    setPackFormat: (format: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    packFormat: null,
    setPackFormat: (format) => set({ packFormat: format })
}));
