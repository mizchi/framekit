import type { ApiBase } from "@mizchi/framekit";

export interface Api extends ApiBase {
  init(opts: { files: { [k: string]: string } }): Promise<void>;
}
