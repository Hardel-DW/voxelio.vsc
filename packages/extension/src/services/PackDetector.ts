import * as vscode from "vscode";
import type { MutableRegistries, PackInfo, RegistriesPayload } from "@/types.ts";

type PackVersion = number | [number] | [number, number];

interface PackMcmeta {
    pack?: {
        pack_format?: number;
        min_format?: PackVersion;
        max_format?: PackVersion;
        description?: string;
    };
}

// Categories that can contain resources in a datapack
const DATAPACK_CATEGORIES = [
    "advancement",
    "chat_type",
    "damage_type",
    "dimension",
    "dimension_type",
    "enchantment",
    "enchantment_provider",
    "function",
    "item_modifier",
    "jukebox_song",
    "loot_table",
    "painting_variant",
    "predicate",
    "recipe",
    "structure",
    "trim_material",
    "trim_pattern",
    "wolf_variant",
    "worldgen/biome",
    "worldgen/configured_carver",
    "worldgen/configured_feature",
    "worldgen/density_function",
    "worldgen/flat_level_generator_preset",
    "worldgen/multi_noise_biome_source_parameter_list",
    "worldgen/noise",
    "worldgen/noise_settings",
    "worldgen/placed_feature",
    "worldgen/processor_list",
    "worldgen/structure",
    "worldgen/structure_set",
    "worldgen/template_pool",
    "worldgen/world_preset",
    "tags/block",
    "tags/entity_type",
    "tags/fluid",
    "tags/function",
    "tags/game_event",
    "tags/item"
];

export class PackDetector {
    async detect(): Promise<PackInfo | null> {
        const files = await vscode.workspace.findFiles("pack.mcmeta", null, 1);

        if (files.length === 0) {
            return null;
        }

        const uri = files[0];
        const content = await this.readJson<PackMcmeta>(uri);
        const packFormat = this.extractPackFormat(content);

        if (packFormat === null) {
            return null;
        }

        return { uri, packFormat, description: content?.pack?.description };
    }

    async scanWorkspaceRegistries(): Promise<RegistriesPayload> {
        const registries: MutableRegistries = {};
        const dataFiles = await vscode.workspace.findFiles("data/**/*.json");

        for (const file of dataFiles) {
            const parsed = this.parseDatapackPath(file.fsPath);
            if (!parsed) continue;

            const { namespace, category, resourcePath } = parsed;
            const resourceId = `${namespace}:${resourcePath}`;

            if (!registries[category]) {
                registries[category] = [];
            }
            if (!registries[category].includes(resourceId)) {
                registries[category].push(resourceId);
            }
        }

        // Sort each registry
        for (const key of Object.keys(registries)) {
            registries[key].sort();
        }

        return registries;
    }

    private parseDatapackPath(fsPath: string): { namespace: string; category: string; resourcePath: string } | null {
        // Normalize path separators
        const normalizedPath = fsPath.replace(/\\/g, "/");

        // Match: data/{namespace}/{category}/{...path}.json
        const match = normalizedPath.match(/data\/([^/]+)\/([^/]+(?:\/[^/]+)?)\/(.+)\.json$/);
        if (!match) return null;

        const [, namespace, categoryPath, resourcePath] = match;

        // Find matching category (handles nested categories like worldgen/biome, tags/block)
        const category = DATAPACK_CATEGORIES.find((c) => categoryPath === c || categoryPath.startsWith(`${c}/`)) ?? categoryPath;

        // Adjust resource path for nested categories
        let finalResourcePath = resourcePath;
        if (categoryPath !== category && categoryPath.startsWith(`${category}/`)) {
            const subPath = categoryPath.slice(category.length + 1);
            finalResourcePath = `${subPath}/${resourcePath}`;
        }

        return { namespace, category, resourcePath: finalResourcePath };
    }

    private extractPackFormat(content: PackMcmeta | null): number | null {
        if (!content?.pack) return null;

        const { min_format, max_format, pack_format } = content.pack;

        if (min_format !== undefined) return this.extractMajorVersion(min_format);
        if (max_format !== undefined) return this.extractMajorVersion(max_format);
        if (pack_format !== undefined) return pack_format;

        return null;
    }

    private extractMajorVersion(version: PackVersion): number {
        return Array.isArray(version) ? version[0] : version;
    }

    private async readJson<T>(uri: vscode.Uri): Promise<T | null> {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const text = new TextDecoder().decode(bytes);

        try {
            return JSON.parse(text) as T;
        } catch {
            return null;
        }
    }
}
