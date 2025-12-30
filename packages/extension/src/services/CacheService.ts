import { promises } from "node:fs";
import { join } from "node:path";
import type { ExtensionContext } from "vscode";
import type { VersionConfig } from "@/types.ts";

const MCMETA_URL = "https://raw.githubusercontent.com/misode/mcmeta";
const VANILLA_MCDOC_URL = "https://raw.githubusercontent.com/SpyglassMC/vanilla-mcdoc";

export interface VanillaMcdocSymbols {
    readonly ref: string;
    readonly mcdoc: Record<string, unknown>;
    readonly "mcdoc/dispatcher": Record<string, Record<string, unknown>>;
}

export class CacheService {
    private readonly cachePath: string;

    constructor(context: ExtensionContext) {
        this.cachePath = context.globalStorageUri.fsPath;
    }

    async ensureCacheDir(): Promise<void> {
        await promises.mkdir(this.cachePath, { recursive: true });
    }

    async getRegistries(version: VersionConfig): Promise<Map<string, string[]>> {
        const cacheFile = join(this.cachePath, `registries-${version.ref}.json`);
        const cached = await this.readCache<Record<string, string[]>>(cacheFile);

        if (cached) {
            return this.parseRegistries(cached);
        }

        const url = `${MCMETA_URL}/${version.ref}-summary/registries/data.min.json`;
        const data = await this.fetchJson<Record<string, string[]>>(url);
        await this.writeCache(cacheFile, data);

        return this.parseRegistries(data);
    }

    async getMcdocSymbols(): Promise<VanillaMcdocSymbols> {
        const cacheFile = join(this.cachePath, "mcdoc-symbols.json");
        const cached = await this.readCache<VanillaMcdocSymbols>(cacheFile);

        if (cached) {
            return cached;
        }

        const url = `${VANILLA_MCDOC_URL}/generated/symbols.json`;
        const data = await this.fetchJson<VanillaMcdocSymbols>(url);
        await this.writeCache(cacheFile, data);

        return data;
    }

    async getBlockStates(version: VersionConfig): Promise<Map<string, unknown>> {
        const cacheFile = join(this.cachePath, `blocks-${version.ref}.json`);
        const cached = await this.readCache<Record<string, unknown>>(cacheFile);

        if (cached) {
            return new Map(Object.entries(cached));
        }

        const url = `${MCMETA_URL}/${version.ref}-summary/blocks/data.min.json`;
        const data = await this.fetchJson<Record<string, unknown>>(url);
        await this.writeCache(cacheFile, data);

        return new Map(Object.entries(data));
    }

    async invalidateCache(): Promise<void> {
        const files = await promises.readdir(this.cachePath).catch(() => []);

        for (const file of files) {
            await promises.unlink(join(this.cachePath, file)).catch(() => {});
        }
    }

    private parseRegistries(data: Record<string, string[]>): Map<string, string[]> {
        const result = new Map<string, string[]>();

        for (const [id, values] of Object.entries(data)) {
            result.set(
                id,
                values.map((e) => `minecraft:${e}`)
            );
        }

        return result;
    }

    private async readCache<T>(filePath: string): Promise<T | null> {
        try {
            const content = await promises.readFile(filePath, "utf-8");
            return JSON.parse(content) as T;
        } catch {
            return null;
        }
    }

    private async writeCache(filePath: string, data: unknown): Promise<void> {
        await this.ensureCacheDir();
        await promises.writeFile(filePath, JSON.stringify(data));
    }

    private async fetchJson<T>(url: string): Promise<T> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }
}
