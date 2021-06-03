<script lang="ts">
  import type { Api } from "../types";
  import { proxy } from "comlink";
  import SvelteFramekitAdapter from "./SvelteFramekitAdapter.svelte";
  import DraggableWindow from "./DraggableWindow.svelte";

  export let initialFiles: { [k: string]: string };
  export let onChangeContent: (k: string, v: string) => void;

  const onApiReady = async (ev: CustomEvent<{ api: Api }>) => {
    await ev.detail.api.init(initialFiles, proxy(onChangeContent));
  };
</script>

<DraggableWindow x={100} y={100} w={600} h={400} coverOnHolding>
  <div slot="header">Editor</div>
  <SvelteFramekitAdapter url="/" on:apiready={onApiReady} />
</DraggableWindow>
