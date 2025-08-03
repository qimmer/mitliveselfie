import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  ssr: false,
  vite: {
    ssr: { external: ["drizzle-orm"] },
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      mdx({ jsxImportSource: "solid-jsx", remarkPlugins: [remarkGfm] }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  },
});
