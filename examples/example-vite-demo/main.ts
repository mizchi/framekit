import type { Api } from "@mizchi/framekit-example-vite";
import { create } from "@mizchi/framekit";

(async () => {
  const { element, render } = await create<Api>({
    url: "https://naughty-swirles-79db81.netlify.app/",
  });
  element.style.width = "500px";
  element.style.height = "500px";
  element.style.background = "wheat";
  const api = await render(document.body);
  await api.init();
  await api.run();
})().catch(console.error);
