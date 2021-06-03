import type { SvelteComponentTyped } from "svelte";
export * from "./core";

import DraggableWindow_ from "./svelte/DraggableWindow.svelte";
import SvelteFramekitAdapter_ from "./svelte/SvelteFramekitAdapter.svelte";

export const DraggableWindow: SvelteComponentTyped<{
  x: number;
  y: number;
  w: number;
  h: number;
  coverOnHolding?: boolean;
  id?: string;
  zIndex?: number;
  disabled?: boolean;
}> = DraggableWindow_ as any;

export const SvelteFramekitAdapter: SvelteComponentTyped<
  {
    url: string;
    width?: number;
    height?: number;
  },
  {
    apiready: { api: any };
  }
> = SvelteFramekitAdapter_ as any;
