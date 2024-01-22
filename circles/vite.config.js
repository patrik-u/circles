import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(() => {
    return {
        build: {
            outDir: "build",
        },
        plugins: [react()],
        server: {
            open: true,
            port: 3000,
        },
        resolve: {
            alias: {
                "@": resolve(__dirname, "src"),
            },
        },
    };
});
