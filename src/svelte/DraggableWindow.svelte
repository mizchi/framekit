<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let x: number;
  export let y: number;
  export let w: number;
  export let h: number;

  export let id: string = Math.random().toString();
  export let zIndex = 0;
  export let coverOnHolding: boolean = false;
  export let disabled: boolean = false;

  let header: HTMLElement;
  let resizer: HTMLElement;

  const dispatch =
    createEventDispatcher<{
      dragstart: { id: string };
      dragend: { id: string };
    }>();
  let holdingHeader: null | {
    originalX: number;
    originalY: number;
    startX: number;
    startY: number;
  } = null;
  let holdingResizer: null | {
    originalW: number;
    originalH: number;
    startX: number;
    startY: number;
  } = null;

  const onMouseDown = (ev: MouseEvent) => {
    if (ev.target === header) {
      holdingHeader = {
        originalX: x,
        originalY: y,
        startX: ev.pageX,
        startY: ev.pageY,
      };
      dispatch("dragstart", { id });
      window.document.body.style.cursor = "grabbing";
    } else if (ev.target === resizer) {
      holdingResizer = {
        originalW: w,
        originalH: h,
        startX: ev.pageX,
        startY: ev.pageY,
      };
      window.document.body.style.cursor = "grabbing";
    }
  };
  const onMouseMove = (ev: MouseEvent) => {
    if (holdingHeader) {
      const deltaX = ev.pageX - holdingHeader.startX;
      const deltaY = ev.pageY - holdingHeader.startY;
      x = holdingHeader.originalX + deltaX;
      y = holdingHeader.originalY + deltaY;
      // console.log("mousemove: ", x, y);
    }
    if (holdingResizer) {
      const deltaX = ev.pageX - holdingResizer.startX;
      const deltaY = ev.pageY - holdingResizer.startY;
      w = holdingResizer.originalW + deltaX;
      h = holdingResizer.originalH + deltaY;
      // console.log("mousemove: ", x, y);
    }
  };
  const onMouseUp = (ev: MouseEvent) => {
    // run dragend
    if (holdingHeader || holdingResizer) {
      dispatch("dragend", { id });
    }
    holdingHeader = null;
    holdingResizer = null;
    window.document.body.style.cursor = "auto";
  };

  $: holding = !!holdingHeader || !!holdingResizer;
</script>

<svelte:window
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
/>

<div
  class="win"
  style="left: {x}px; top: {y}px; width:{w}px;height:{h}px; z-index: {zIndex};"
>
  <div
    class="corner"
    bind:this={resizer}
    style={holdingResizer ? "" : "cursor: grab;"}
  >
    ⤡
  </div>
  <div
    class="win-header"
    bind:this={header}
    style={holdingHeader ? "" : "cursor: grab;"}
  >
    <slot name="header" />
  </div>
  <div class="win-content">
    {#if (coverOnHolding && holding) || disabled}
      <div class="cover" />
    {/if}
    <slot />
  </div>
</div>

<style>
  .win {
    position: relative;
    box-sizing: border-box;
    border: 1px solid black;
    position: absolute;
  }
  .win-header {
    width: 100%;
    height: 24px;
    background: #ddd;
    user-select: none;
    display: grid;
    place-items: center;
  }
  .win-content {
    position: relative;
    width: 100%;
    height: calc(100% - 24px);
  }
  .corner {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 25px;
    height: 25px;
    font-size: 18px;
    background: white;
    outline: 1px solid black;
    z-index: 10;
    display: grid;
    place-items: center;
    user-select: none;
  }
  .cover {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
  }
</style>
