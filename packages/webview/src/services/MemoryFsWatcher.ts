import type { FsWatcher } from "@spyglassmc/core";

type WatcherListener = (...args: never[]) => unknown;

export class MemoryFsWatcher implements FsWatcher {
    readonly #listeners = new Map<string, { all: Set<WatcherListener>; once: Set<WatcherListener> }>();

    emit(eventName: string, ...args: unknown[]): boolean {
        const listeners = this.#listeners.get(eventName);
        if (!listeners?.all?.size) return false;

        for (const listener of listeners.all) {
            (listener as (...a: unknown[]) => unknown)(...args);
            if (listeners.once.has(listener)) {
                listeners.all.delete(listener);
                listeners.once.delete(listener);
            }
        }
        return true;
    }

    on(eventName: "ready", listener: () => unknown): this;
    on(eventName: "add", listener: (uri: string) => unknown): this;
    on(eventName: "change", listener: (uri: string) => unknown): this;
    on(eventName: "unlink", listener: (uri: string) => unknown): this;
    on(eventName: "error", listener: (error: Error) => unknown): this;
    on(eventName: string, listener: WatcherListener): this {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, { all: new Set(), once: new Set() });
        }
        this.#listeners.get(eventName)?.all.add(listener);
        return this;
    }

    once(eventName: "ready", listener: () => unknown): this;
    once(eventName: "add", listener: (uri: string) => unknown): this;
    once(eventName: "change", listener: (uri: string) => unknown): this;
    once(eventName: "unlink", listener: (uri: string) => unknown): this;
    once(eventName: "error", listener: (error: Error) => unknown): this;
    once(eventName: string, listener: WatcherListener): this {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, { all: new Set(), once: new Set() });
        }
        const listeners = this.#listeners.get(eventName);
        listeners?.all.add(listener);
        listeners?.once.add(listener);
        return this;
    }

    async close(): Promise<void> {}
}
