import { defineConfig } from "vite";

export default defineConfig({
    server: {
        open: true
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    publicDir: "public" // ✅ Ensure Vite serves from "public/"
});
