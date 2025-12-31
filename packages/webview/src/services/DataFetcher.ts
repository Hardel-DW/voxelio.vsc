import type { VersionConfig } from "@/types.ts";

const MCMETA_URL = "https://raw.githubusercontent.com/misode/mcmeta";
const VANILLA_MCDOC_URL = "https://raw.githubusercontent.com/SpyglassMC/vanilla-mcdoc";
const CACHE_NAME = "minode-v1";

export interface VanillaMcdocSymbols {
    readonly ref: string;
    readonly mcdoc: Record<string, unknown>;
    readonly "mcdoc/dispatcher": Record<string, Record<string, unknown>>;
}

export interface VersionMeta {
    readonly id: string;
    readonly name: string;
    readonly data_pack_version: number;
    readonly resource_pack_version: number;
}

export type BlockStateData = [Record<string, string[]>, Record<string, string>];

export async function fetchRegistries(version: VersionConfig): Promise<Map<string, string[]>> {
    const ref = version.dynamic ? "summary" : `${version.ref}-summary`;
    const url = `${MCMETA_URL}/${ref}/registries/data.min.json`;
    const data = await cachedFetch<Record<string, string[]>>(url);

    const result = new Map<string, string[]>();
    for (const [id, values] of Object.entries(data)) {
        result.set(
            id,
            values.map((e) => `minecraft:${e}`)
        );
    }
    return result;
}

export async function fetchBlockStates(version: VersionConfig): Promise<Map<string, BlockStateData>> {
    const ref = version.dynamic ? "summary" : `${version.ref}-summary`;
    const url = `${MCMETA_URL}/${ref}/blocks/data.min.json`;
    const data = await cachedFetch<Record<string, BlockStateData>>(url);
    return new Map(Object.entries(data));
}

export async function fetchVanillaMcdoc(): Promise<VanillaMcdocSymbols> {
    const url = `${VANILLA_MCDOC_URL}/generated/symbols.json`;
    return cachedFetch<VanillaMcdocSymbols>(url, { refresh: true });
}

export async function fetchVersions(): Promise<VersionMeta[]> {
    const url = `${MCMETA_URL}/summary/versions/data.min.json`;
    return cachedFetch<VersionMeta[]>(url, { refresh: true });
}

interface FetchOptions {
    refresh?: boolean;
}

const REFRESHED = new Set<string>();

async function cachedFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    let { refresh } = options;

    try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);

        if (refresh && REFRESHED.has(url)) {
            refresh = false;
        } else if (refresh) {
            REFRESHED.add(url);
        }

        if (refresh) {
            try {
                return await fetchAndCache<T>(cache, url);
            } catch {
                if (cached?.ok) {
                    return cached.json() as Promise<T>;
                }
                throw new Error(`Failed to fetch ${url}`);
            }
        }

        if (cached?.ok) {
            return cached.json() as Promise<T>;
        }

        return fetchAndCache<T>(cache, url);
    } catch {
        const response = await fetch(url);
        return response.json() as Promise<T>;
    }
}

async function fetchAndCache<T>(cache: Cache, url: string): Promise<T> {
    const response = await fetch(url);
    const clone = response.clone();
    const data = (await response.json()) as T;
    await cache.put(url, clone);
    return data;
}
