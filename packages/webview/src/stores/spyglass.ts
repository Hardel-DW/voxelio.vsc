import { create } from "zustand";
import type { SpyglassService } from "@/services/SpyglassService.ts";

interface SpyglassState {
    service: SpyglassService | null;
    loading: boolean;
    error: string | null;
    setService: (service: SpyglassService) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
}

export const useSpyglassStore = create<SpyglassState>((set) => ({
    service: null,
    loading: false,
    error: null,
    setService: (service) => set({ service, loading: false, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false })
}));
