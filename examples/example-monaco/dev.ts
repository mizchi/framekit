// import { proxy } from "comlink";
const initialFiles = {
  "/index.tsx": "import foo from './foo';\nconsole.log(foo);",
  "/foo.ts": "export default 1",
};

const onChangeContent = (filepath: string, content: string) => {
  console.log("dev:onchange", filepath, content);
};

import App from "./src/App.svelte";

(async () => {
  new App({
    target: document.body,
    props: {
      initialFiles,
      onChangeContent,
    },
  });
})().catch(console.error);
