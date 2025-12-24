import * as vscode from "vscode";
import type { PackInfo } from "@/types.ts";

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
