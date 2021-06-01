import { expose, windowEndpoint } from "comlink";
import { api } from "./api";

expose(api, windowEndpoint(self.parent));
console.log("impl ready");
