import type { Remote } from "comlink";
import { wrap, windowEndpoint, expose } from "comlink";

export type ApiBase = {
  __ready__(): Promise<boolean>;
  __standalone__: () => Promise<void>;
  [key: string]: (...args: Array<any>) => Promise<any>;
};
export async function attachWidgetApi<T extends ApiBase>(config: {
  element: HTMLIFrameElement;
  url: string;
  sandbox?: string;
}): Promise<Remote<T>> {
  const element =
    config.element ??
    createWidgetElement({
      url: config.url,
      sandbox: config.sandbox,
    });
  await new Promise((r) => (element.onload = r));
  return wrap<T>(windowEndpoint(element.contentWindow!));
}

export function createWidgetElement(config: {
  url: string;
  sandbox?: string;
}): HTMLIFrameElement {
  const element = document.createElement("iframe");
  element.style.border = "none";
  element.style.padding = "0";
  // @ts-ignore
  element.sandbox = config.sandbox ?? "allow-scripts";
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
          const isReady = await api.__ready__();
          if (isReady) {
            r(api);
            return;
          }
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

export async function create<T extends ApiBase>(config: {
  url: string;
  sandbox?: string;
}) {
  const element = createWidgetElement(config);
  return {
    element,
    async render(parent: HTMLElement) {
      parent.appendChild(element);
      return await ensureApiReady<T>(element);
    },
  };
}

export async function exposeIframe<T extends ApiBase = any>(api: T) {
  // standalone
  if (window.parent !== window) {
    expose(api, windowEndpoint(self.parent));
  } else {
    api.__standalone__?.();
  }
}
