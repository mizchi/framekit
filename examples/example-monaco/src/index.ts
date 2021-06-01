import type { Api } from "../types";
import { App } from "./App";
import React from "react";
import ReactDOM from "react-dom";
import { expose, windowEndpoint } from "comlink";

export const api: Api = {
  async init(opts) {
    const el = document.createElement("div");
    el.style.width = "100%";
    el.style.height = "100%";
    document.body.appendChild(el);
    ReactDOM.render(React.createElement(App, { initialFiles: opts.files }), el);
    console.log("init");
  },
  async ready() {
    return true;
  },
};

expose(api, windowEndpoint(self.parent));
