import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [tailwindcss(), react()],
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
