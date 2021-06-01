import ts from "@wessberg/rollup-plugin-ts";
export default {
  input: "src/index.ts",
  external: ["comlink"],
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [ts({})],
};
