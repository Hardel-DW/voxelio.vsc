import type { McdocFile, MutableRegistries, PackDetectionResult, RegistriesPayload, SpyglassConfig } from "@voxel/shared";
import { RelativePattern, Uri, workspace } from "vscode";

const SPYGLASS_CONFIG_NAMES = ["spyglass.json", ".spyglassrc", ".spyglassrc.json"] as const;

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
    async findPackRootFromFile(fileUri: Uri): Promise<PackDetectionResult> {
        const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            return { status: "notFound" };
        }

        let currentDir = Uri.joinPath(fileUri, "..");

        while (currentDir.fsPath.length >= workspaceRoot.length) {
            const packMcmetaUri = Uri.joinPath(currentDir, "pack.mcmeta");

            try {
                await workspace.fs.stat(packMcmetaUri);
                return this.validatePackMcmeta(packMcmetaUri);
            } catch {
                const parentDir = Uri.joinPath(currentDir, "..");
                if (parentDir.fsPath === currentDir.fsPath) {
                    break;
                }
                currentDir = parentDir;
            }
        }

        return { status: "notFound" };
    }

    private async validatePackMcmeta(uri: Uri): Promise<PackDetectionResult> {
        const content = await this.readJson<PackMcmeta>(uri);
        const uriString = uri.toString();

        if (content === null) {
            return { status: "invalid", uri: uriString, reason: "Invalid JSON syntax" };
        }

        if (!content.pack) {
            return { status: "invalid", uri: uriString, reason: "Missing 'pack' object" };
        }

        const packFormat = this.extractPackFormat(content);

        if (packFormat === null) {
            return { status: "invalid", uri: uriString, reason: "Missing or invalid pack_format" };
        }

        return { status: "found", pack: { uri: uriString, packFormat, description: content.pack.description } };
    }

    async scanMcdocFiles(packRoot?: Uri): Promise<McdocFile[]> {
        const baseUri = packRoot ?? workspace.workspaceFolders?.[0]?.uri;
        if (!baseUri) return [];

        const pattern = new RelativePattern(Uri.joinPath(baseUri, "mcdoc"), "**/*.mcdoc");
        const files = await workspace.findFiles(pattern);
        const results: McdocFile[] = [];

        for (const file of files) {
            const content = await this.readTextFile(file);
            if (content !== null) {
                results.push({ uri: file.toString(), content });
            }
        }

        return results;
    }

    async scanSpyglassConfig(packRoot?: Uri): Promise<SpyglassConfig | null> {
        const baseUri = packRoot ?? workspace.workspaceFolders?.[0]?.uri;
        if (!baseUri) return null;

        for (const configName of SPYGLASS_CONFIG_NAMES) {
            const configUri = Uri.joinPath(baseUri, configName);
            const config = await this.readJson<SpyglassConfig>(configUri);
            if (config !== null) {
                return config;
            }
        }

        return null;
    }

    async scanWorkspaceRegistries(packRoot?: Uri): Promise<RegistriesPayload> {
        const registries: MutableRegistries = {};

        const dataJsonPattern = packRoot ? new RelativePattern(packRoot, "data/**/*.json") : "data/**/*.json";
        const assetsJsonPattern = packRoot ? new RelativePattern(packRoot, "assets/**/*.json") : "assets/**/*.json";
        const mcfunctionPattern = packRoot
            ? new RelativePattern(packRoot, "data/**/function/**/*.mcfunction")
            : "data/**/function/**/*.mcfunction";

        const [dataJsonFiles, assetsJsonFiles, mcfunctionFiles] = await Promise.all([
            workspace.findFiles(dataJsonPattern),
            workspace.findFiles(assetsJsonPattern),
            workspace.findFiles(mcfunctionPattern)
        ]);

        for (const file of dataJsonFiles) {
            this.addToRegistries(registries, file.fsPath, ".json", "data");
        }

        for (const file of assetsJsonFiles) {
            this.addToRegistries(registries, file.fsPath, ".json", "assets");
        }

        for (const file of mcfunctionFiles) {
            this.addToRegistries(registries, file.fsPath, ".mcfunction", "data");
        }

        for (const key of Object.keys(registries)) {
            registries[key].sort();
        }

        return registries;
    }

    private addToRegistries(registries: MutableRegistries, fsPath: string, ext: string, packType: "data" | "assets"): void {
        const parsed = this.parsePackPath(fsPath, ext, packType);
        if (!parsed) return;

        const { category, resourceId } = parsed;
        registries[category] ??= [];
        if (!registries[category].includes(resourceId)) {
            registries[category].push(resourceId);
        }
    }

    private parsePackPath(fsPath: string, ext: string, packType: "data" | "assets"): { category: string; resourceId: string } | null {
        const normalizedPath = fsPath.replace(/\\/g, "/");
        const extEscaped = ext.replace(".", "\\.");
        const regex = new RegExp(`${packType}/([^/]+)/(.+)${extEscaped}$`);
        const match = normalizedPath.match(regex);
        if (!match) return null;

        const [, namespace, restPath] = match;
        const parts = restPath.split("/");
        if (parts.length < 2) return null;

        const category = this.extractCategory(parts);
        const resourcePath = this.extractResourcePath(parts);

        return { category, resourceId: `${namespace}:${resourcePath}` };
    }

    private extractCategory(parts: string[]): string {
        if (parts[0] === "tags" && parts.length >= 3) {
            return `tag/${parts[1]}`;
        }
        if (parts[0] === "worldgen" && parts.length >= 3) {
            return `worldgen/${parts[1]}`;
        }
        return parts[0];
    }

    private extractResourcePath(parts: string[]): string {
        if ((parts[0] === "tags" || parts[0] === "worldgen") && parts.length >= 3) {
            return parts.slice(2).join("/");
        }
        return parts.slice(1).join("/");
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

    private async readJson<T>(uri: Uri): Promise<T | null> {
        const text = await this.readTextFile(uri);
        if (text === null) return null;

        try {
            return JSON.parse(text) as T;
        } catch {
            return null;
        }
    }

    private async readTextFile(uri: Uri): Promise<string | null> {
        try {
            const bytes = await workspace.fs.readFile(uri);
            return new TextDecoder().decode(bytes);
        } catch {
            return null;
        }
    }
}
