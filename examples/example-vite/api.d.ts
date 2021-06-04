import type { ApiBase } from "@mizchi/framekit";

export interface Api extends ApiBase {
  init(base: number, callback: (now: number) => void): Promise<void>;
}
