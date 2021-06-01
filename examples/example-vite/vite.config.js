import pkg from "./package.json";
import { defineConfig } from "vite";
import replace from "@rollup/plugin-replace";

export default defineConfig({
  build:
    process.env.MODE == "app"
      ? {
          outDir: "app",
        }
      : {
          lib: {
            entry: "src/index.ts",
            name: "index",
            formats: ["es"],
          },
        },
  plugins: [
    replace({
      "process.env.VERSION": JSON.stringify(pkg.name),
      "process.env.DEFAULT_URL": JSON.stringify(process.env.DEFAULT_URL),
      preventAssignment: true,
    }),
  ],
});
