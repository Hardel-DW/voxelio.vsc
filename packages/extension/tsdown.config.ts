import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/extension.ts"],
    outDir: "dist",
    platform: "node",
    external: ["vscode"],
    format: "cjs",
    clean: true,
    noExternal: ["@voxel/shared"]
});
