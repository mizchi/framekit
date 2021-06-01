import type { Api } from "../types";
import { expose, windowEndpoint } from "comlink";
export const api: Api = {
  async init() {
    setInterval(() => {
      document.body.innerHTML = Date.now().toString();
    }, 1000);
  },
  async run() {
    console.log("ran!");
  },
  async ready() {
    return true;
  },
};

expose(api, windowEndpoint(self.parent));
