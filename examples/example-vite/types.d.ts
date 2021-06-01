import type { ApiBase } from "@mizchi/framekit";

export interface Api extends ApiBase {
  init(): Promise<void>;
  run(): Promise<void>;
}
