import type { ApiBase } from "./framekit";

export interface Api extends ApiBase {
  init(): Promise<void>;
  run(): Promise<void>;
}

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
