import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [preact()],
    resolve: {
        tsconfigPaths: true
    },
    build: {
        outDir: "../extension/dist/webview",
        emptyOutDir: true,
        rolldownOptions: {
            input: "src/main.tsx",
            output: {
                entryFileNames: "index.js",
                assetFileNames: "index.[ext]"
            }
        }
    }
});
