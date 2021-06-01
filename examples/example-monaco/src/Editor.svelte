<script lang="ts">
  import type monaco from "monaco-editor";
  import { onMount } from "svelte";
  import { createCodeEditor } from "./monaco_helper";

  export let files: { [k: string]: string };
  export let filepath: string;

  let editor: monaco.editor.IStandaloneCodeEditor;
  let editorElement: HTMLElement;

  let internalFiles = { ...files };

  $: if (files !== internalFiles) {
    internalFiles = files;
  }
  onMount(async () => {
    editor = await createCodeEditor(
      editorElement,
      files[filepath],
      (editor) => {
        const changed = editor.getValue();
        if (internalFiles[filepath] !== changed) {
          internalFiles = {
            ...internalFiles,
            [filepath]: changed,
          };
          files = internalFiles;
        }
      }
    );
    editor.layout();
    editor.focus();
  });
</script>

<div class="editor" bind:this={editorElement} />


<style>
  .editor {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
