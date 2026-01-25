import type { ExternalFileSystem, FsLocation, FsWatcher } from "@spyglassmc/core";
import { MemoryFsWatcher } from "@/services/MemoryFsWatcher.ts";

interface DirEntry {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
}

export class MemoryFileSystem implements ExternalFileSystem {
    private readonly files = new Map<string, Uint8Array<ArrayBuffer>>();
    private readonly dirs = new Set<string>();

    async chmod(): Promise<void> {}

    async mkdir(location: FsLocation): Promise<void> {
        this.dirs.add(String(location));
    }

    async readdir(location: FsLocation): Promise<DirEntry[]> {
        const uriStr = String(location);
        const prefix = uriStr.endsWith("/") ? uriStr : `${uriStr}/`;
        const entries: DirEntry[] = [];

        for (const path of this.files.keys()) {
            if (path.startsWith(prefix)) {
                const remaining = path.slice(prefix.length);
                const name = remaining.split("/")[0];
                if (name && !entries.some((e) => e.name === name)) {
                    entries.push({ name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false });
                }
            }
        }
        return entries;
    }

    async readFile(location: FsLocation): Promise<Uint8Array<ArrayBuffer>> {
        const content = this.files.get(String(location));
        if (!content) throw new Error(`File not found: ${location}`);
        return content;
    }

    async showFile(): Promise<void> {}

    async stat(location: FsLocation): Promise<{ isFile(): boolean; isDirectory(): boolean }> {
        const uriStr = String(location);
        if (this.files.has(uriStr)) return { isFile: () => true, isDirectory: () => false };
        if (this.dirs.has(uriStr)) return { isFile: () => false, isDirectory: () => true };
        throw new Error(`Not found: ${location}`);
    }

    async unlink(location: FsLocation): Promise<void> {
        this.files.delete(String(location));
    }

    watch(): FsWatcher {
        const watcher = new MemoryFsWatcher();
        queueMicrotask(() => watcher.emit("ready"));
        return watcher;
    }

    async writeFile(location: FsLocation, data: string | Uint8Array<ArrayBuffer>): Promise<void> {
        const content = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
        this.files.set(String(location), content);
    }
}
