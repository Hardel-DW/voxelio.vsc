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

        // Scan JSON files and mcfunction files
        const [jsonFiles, mcfunctionFiles] = await Promise.all([
            vscode.workspace.findFiles("data/**/*.json"),
            vscode.workspace.findFiles("data/**/function/**/*.mcfunction")
        ]);

        for (const file of jsonFiles) {
            const parsed = this.parseDatapackPath(file.fsPath, ".json");
            if (!parsed) continue;

            const { category, resourceId } = parsed;
            if (!registries[category]) {
                registries[category] = [];
            }
            if (!registries[category].includes(resourceId)) {
                registries[category].push(resourceId);
            }
        }

        for (const file of mcfunctionFiles) {
            const parsed = this.parseDatapackPath(file.fsPath, ".mcfunction");
            if (!parsed) continue;

            const { category, resourceId } = parsed;
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

    private parseDatapackPath(fsPath: string, ext: string): { category: string; resourceId: string } | null {
        const normalizedPath = fsPath.replace(/\\/g, "/");

        // Match: data/{namespace}/{...rest}
        const extEscaped = ext.replace(".", "\\.");
        const regex = new RegExp(`data/([^/]+)/(.+)${extEscaped}$`);
        const match = normalizedPath.match(regex);
        if (!match) return null;

        const [, namespace, restPath] = match;
        const parts = restPath.split("/");

        if (parts.length < 2) return null;

        // Determine category and resource path based on structure
        let category: string;
        let resourcePath: string;

        if (parts[0] === "tags" && parts.length >= 3) {
            // tags/{type}/{...path} → category: tag/{type}
            category = `tag/${parts[1]}`;
            resourcePath = parts.slice(2).join("/");
        } else if (parts[0] === "worldgen" && parts.length >= 3) {
            // worldgen/{type}/{...path} → category: worldgen/{type}
            category = `worldgen/${parts[1]}`;
            resourcePath = parts.slice(2).join("/");
        } else {
            // {category}/{...path}
            category = parts[0];
            resourcePath = parts.slice(1).join("/");
        }

        return { category, resourceId: `${namespace}:${resourcePath}` };
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
