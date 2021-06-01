import type { Remote } from "comlink";
import { wrap, windowEndpoint } from "comlink";

export type ApiBase = {
  ready(): Promise<boolean>;
  [key: string]: (...args: Array<any>) => Promise<any>;
};

export async function attachWidgetApi<T extends ApiBase>(config: {
  element: HTMLIFrameElement;
  url: string;
}): Promise<Remote<T>> {
  const element =
    config.element ??
    createWidgetElement({
      url: config.url,
    });
  await new Promise((r) => (element.onload = r));
  return wrap<T>(windowEndpoint(element.contentWindow!));
}

export function createWidgetElement(config: {
  url: string;
}): HTMLIFrameElement {
  const element = document.createElement("iframe");
  element.style.border = "none";
  element.style.padding = "0";
  element.src = config.url;
  return element;
}

export async function ensureApiReady<T extends ApiBase>(
  element: HTMLIFrameElement
) {
  await new Promise((r) => (element.onload = r));
  return await new Promise<Remote<T>>((r) => {
    const loop = async () => {
      if (element.contentWindow) {
        const api = wrap<T>(windowEndpoint(element.contentWindow!));
        try {
          await api.ready();
          r(api);
        } catch (err) {
          console.error(err);
          setTimeout(loop, 100);
        }
      } else {
        setTimeout(loop, 300);
      }
    };
    loop();
  });
}

export async function create<T extends ApiBase>(config: { url: string }) {
  const element = createWidgetElement(config);
  return {
    element,
    async render(parent: HTMLElement) {
      parent.appendChild(element);
      return await ensureApiReady<T>(element);
    },
  };
}
