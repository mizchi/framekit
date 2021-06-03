import type { ApiBase } from "@mizchi/framekit";

export interface Api extends ApiBase {
  init(
    initialFiles: { [k: string]: string },
    onChangeContent: (filepath: string, content: string) => void
  ): Promise<void>;
}
