import ts from "@wessberg/rollup-plugin-ts";
import svelte from "rollup-plugin-svelte";
import preprocess from "svelte-preprocess";

export default {
  input: "src/index.ts",
  external: ["comlink", "svelte", "svelte/internal"],
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [
    ts({}),
    svelte({
      emitCss: false,
      preprocess: preprocess(),
    }),
  ],
};
