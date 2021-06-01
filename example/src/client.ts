import { create } from "./framekit";
import type { Api } from "./api";

export async function createClient(config: { url: string }) {
  return create<Api>(config);
}
