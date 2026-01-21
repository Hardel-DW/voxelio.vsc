import * as vscode from "vscode";
import type { MutableRegistries, PackDetectionResult, PackInfo, RegistriesPayload } from "@/types.ts";

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
    async detect(): Promise<PackDetectionResult> {
        const files = await vscode.workspace.findFiles("pack.mcmeta", null, 1);

        if (files.length === 0) {
            return { status: "notFound" };
        }

        const uri = files[0];
        return this.validatePackMcmeta(uri);
    }

    async detectAt(uri: vscode.Uri): Promise<PackDetectionResult> {
        const packUri = vscode.Uri.joinPath(uri, "pack.mcmeta");

        try {
            await vscode.workspace.fs.stat(packUri);
            return this.validatePackMcmeta(packUri);
        } catch {
            return { status: "invalid", uri: packUri, reason: "pack.mcmeta not found in selected folder" };
        }
    }

    async findAllPackMcmeta(): Promise<vscode.Uri[]> {
        return vscode.workspace.findFiles("**/pack.mcmeta");
    }

    private async validatePackMcmeta(uri: vscode.Uri): Promise<PackDetectionResult> {
        const content = await this.readJson<PackMcmeta>(uri);

        if (content === null) {
            return { status: "invalid", uri, reason: "Invalid JSON syntax" };
        }

        if (!content.pack) {
            return { status: "invalid", uri, reason: "Missing 'pack' object" };
        }

        const packFormat = this.extractPackFormat(content);

        if (packFormat === null) {
            return { status: "invalid", uri, reason: "Missing or invalid pack_format" };
        }

        const pack: PackInfo = { uri, packFormat, description: content.pack.description };
        return { status: "found", pack };
    }

    async scanWorkspaceRegistries(packRoot?: vscode.Uri): Promise<RegistriesPayload> {
        const registries: MutableRegistries = {};

        const jsonPattern = packRoot
            ? new vscode.RelativePattern(packRoot, "data/**/*.json")
            : "data/**/*.json";
        const mcfunctionPattern = packRoot
            ? new vscode.RelativePattern(packRoot, "data/**/function/**/*.mcfunction")
            : "data/**/function/**/*.mcfunction";

        const [jsonFiles, mcfunctionFiles] = await Promise.all([
            vscode.workspace.findFiles(jsonPattern),
            vscode.workspace.findFiles(mcfunctionPattern)
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

        for (const key of Object.keys(registries)) {
            registries[key].sort();
        }

        return registries;
    }

    private parseDatapackPath(fsPath: string, ext: string): { category: string; resourceId: string } | null {
        const normalizedPath = fsPath.replace(/\\/g, "/");
        const extEscaped = ext.replace(".", "\\.");
        const regex = new RegExp(`data/([^/]+)/(.+)${extEscaped}$`);
        const match = normalizedPath.match(regex);
        if (!match) return null;

        const [, namespace, restPath] = match;
        const parts = restPath.split("/");
        if (parts.length < 2) return null;

        let category: string;
        let resourcePath: string;

        if (parts[0] === "tags" && parts.length >= 3) {
            category = `tag/${parts[1]}`;
            resourcePath = parts.slice(2).join("/");
        } else if (parts[0] === "worldgen" && parts.length >= 3) {
            category = `worldgen/${parts[1]}`;
            resourcePath = parts.slice(2).join("/");
        } else {
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
