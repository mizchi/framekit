import type { Api } from "../api";
import { exposeIframe } from "@mizchi/framekit";

export const api: Api = {
  async init(base: number, callback: (now: number) => void) {
    // // worker test
    // const mod = await import("./on_worker?worker&inline");
    // new mod.default();
    setInterval(() => {
      const delta = Date.now() - base;
      document.body.innerHTML = delta.toString();
      callback(delta);
    }, 1000);
  },
  async __ready__() {
    return true;
  },
  async __standalone__() {
    // as host
    api.init(0, console.log);
  },
};

exposeIframe(api);
