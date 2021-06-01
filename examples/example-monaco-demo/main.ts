import type { Api } from "@mizchi/framekit-example-monaco";
import { create } from "@mizchi/framekit";

(async () => {
  const { element, render } = await create<Api>({
    url: "https://naughty-swirles-79db81.netlify.app/",
  });
  const files = {
    "/index.tsx": "import foo from './foo';\nconsole.log(foo);",
    "/foo.ts": "export default 1",
  };

  element.style.width = "100vw";
  element.style.height = "100vh";
  element.style.background = "gray";
  const api = await render(document.body);
  await api.init({ files });
})().catch(console.error);
