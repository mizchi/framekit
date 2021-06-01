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
            entry: "src/lib.ts",
            formats: ["es"],
          },
        },
  plugins: [
    replace({
      "process.env.DEFAULT_URL": JSON.stringify(process.env.DEFAULT_URL),
      preventAssignment: true,
    }),
  ],
});
