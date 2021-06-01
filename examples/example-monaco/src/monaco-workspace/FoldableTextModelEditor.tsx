import React from "react";
import { useEffect, useRef, useState } from "react";
import type monaco from "monaco-editor";

import { useMonaco, useMonacoEditor, useTextModelContent } from "./useMonaco";

type FoldableTextEditorProps = {
  model: monaco.editor.ITextModel;
  options: monaco.editor.IStandaloneEditorConstructionOptions;
  onChangeContent: (filepath: string, value: string) => void;
  initialViewState?: null | monaco.editor.IEditorViewState;
  focus?: boolean;
};

export function FoldableTextModelEditor(props: FoldableTextEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [size, setSize] =
    useState<{ width: number; height: number } | null>(null);
  // const [viewState, setViewState] =
  //   useState<null | monaco.editor.ICodeEditorViewState>(null);
  useEffect(() => {
    if (parentRef.current) {
      const observer = new ResizeObserver((entries) => {
        const found = entries.find((e) => e.target === parentRef.current);
        if (found) {
          setSize({
            width: found.contentRect.width,
            height: found.contentRect.height,
          });
        }
      });
      observer.observe(parentRef.current);
      const style = parentRef.current.getBoundingClientRect();
      setSize({
        height: style.height,
        width: style.width,
      });
      return () => {
        observer.disconnect();
      };
    }
  }, [parentRef.current]);

  return (
    <div style={{ height: "100%", width: "100%" }} ref={parentRef}>
      {size && (
        <FoldableTextModelEditorInner
          {...props}
          size={size}
          // initialViewState={viewState}
          // onChangeViewState={setViewState}
        />
      )}
    </div>
  );
}

function FoldableTextModelEditorInner(
  props: FoldableTextEditorProps & {
    size: { width: number; height: number };
    // initialViewState: null | monaco.editor.ICodeEditorViewState;
    // onChangeViewState: (viewState: monaco.editor.ICodeEditorViewState) => void;
  }
) {
  const monaco = useMonaco();
  const ref = useRef<HTMLDivElement>(null);
  // const editor = useMonacoEditor(ref, props.options, props.initialViewState);
  const editor = useMonacoEditor(monaco, ref, props.options);
  const [, content] = useTextModelContent(monaco, editor, props.model);

  useEffect(() => {
    if (content == null) return;
    props.onChangeContent(props.model.uri.toString(), content);
    if (editor == null) return;
    // const viewState = editor.saveViewState();
    // viewState && props.onChangeViewState(viewState);
  }, [content, props.model, props.onChangeContent]);

  useEffect(() => {
    if (editor == null) return;
    editor.layout(props.size);
  }, [editor, props.size]);

  useEffect(() => {
    if (editor && props.focus) {
      editor.focus();
    }
  }, []);

  return (
    <div
      style={{ height: "100%", width: "100%", overflow: "hidden" }}
      ref={ref}
    />
  );
}
