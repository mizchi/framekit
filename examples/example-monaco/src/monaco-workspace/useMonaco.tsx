// import { useEffect, useState } from "react";
// // import type Monaco from "monaco-editor";
// // import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// import * as monaco from "monaco-editor";

// // let _monaco: typeof Monaco | null = null;
// // async function ensureMonaco() {
// //   if (_monaco) return _monaco;
// //   const mod = await import("monaco-editor");
// //   _monaco = mod;
// //   return _monaco;
// // }

// export function useMonaco() {
//   // const [monaco, setMonaco] = useState<null | typeof Monaco>(null);
//   // useEffect(() => {
//   //   if (monaco != null) return;
//   //   ensureMonaco().then((m) => {
//   //     setMonaco(m);
//   //   });
//   // }, []);
//   return monaco;
// }

// export function useMonacoEditor(
//   // monaco: typeof Monaco | null,
//   ref: React.RefObject<HTMLElement>,
//   options: monaco.editor.IStandaloneEditorConstructionOptions,
//   initialViewState: null | monaco.editor.ICodeEditorViewState = null
// ): monaco.editor.IStandaloneCodeEditor | null {
//   const [editor, setEditor] =
//     useState<null | monaco.editor.IStandaloneCodeEditor>(null);
//   useEffect(() => {
//     if (monaco && ref.current) {
//       const editor_ = monaco.editor.create(ref.current, options);
//       initialViewState && editor?.restoreViewState(initialViewState);
//       editor_.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
//         editor_.getAction("editor.action.formatDocument").run();
//       });
//       const disposers: Array<() => void> = [];
//       setEditor(editor_);
//       // @ts-ignore
//       // import("monaco-jsx-highlighter").then((x) => {
//       //   const highlightera = new x.default(monaco, j, editor_);
//       //   disposers.push(
//       //     highlighter.highLightOnDidChangeModelContent(),
//       //     highlighter.addJSXCommentCommand()
//       //   );
//       // });
//       return () => {
//         editor_.dispose();
//         disposers.forEach((fn) => fn());
//       };
//     }
//   }, [monaco, ref.current]);

//   useEffect(() => {
//     // console.log("them changed", options.theme);
//     if (monaco == null) return;
//     if (options.theme) {
//       monaco.editor.setTheme(options.theme);
//     }
//     // console.
//   }, [options.theme]);

//   return editor;
// }

// export function useTextModelContent(
//   editor: monaco.editor.IStandaloneCodeEditor | null,
//   model: monaco.editor.ITextModel
// ): [monaco.editor.IModel | null, string | null] {
//   const [content, setContent] = useState<string | null>(null);
//   useEffect(() => {
//     if (monaco == null) return;
//     if (editor == null) return;
//     editor.setModel(model);
//     const disposer = editor.onDidChangeModelContent((_ev: any) => {
//       setContent(editor.getValue());
//     });
//     setContent(model.getValue());
//     return () => {
//       disposer.dispose();
//     };
//   }, [monaco, editor, model]);
//   return [model, content];
// }

// export function useTextModels() {
//   const monaco = useMonaco();
//   const [models, setModels] = useState<monaco.editor.IModel[]>([]);
//   useEffect(() => {
//     if (monaco == null) return;
//     const updateModels = () => {
//       const newModels = monaco!.editor.getModels();
//       setModels(newModels);
//     };
//     const d1 = monaco.editor.onDidCreateModel(updateModels);
//     const d2 = monaco.editor.onWillDisposeModel(updateModels);
//     updateModels();
//     return () => {
//       d1.dispose();
//       d2.dispose();
//     };
//   }, [monaco]);
//   return models;
// }

import { useEffect, useState } from "react";
import type Monaco from "monaco-editor";
// import { loader as monacoLoader } from "@monaco-editor/react";
// import j from "jscodeshift";
// import { emmetHTML, emmetCSS } from "emmet-monaco-es";

let _monaco: typeof Monaco | null = null;
export async function ensureMonaco() {
  if (_monaco) return _monaco;
  const mod = await import("monaco-editor");
  _monaco = mod;
  return _monaco;
}

export function useMonaco() {
  const [monaco, setMonaco] = useState<null | typeof Monaco>(null);
  useEffect(() => {
    if (monaco != null) return;
    // let disposers: Array<() => void> = [];
    ensureMonaco().then((monaco_) => {
      // disposers.push(emmetHTML(monaco_), emmetCSS(monaco_));
      setMonaco(monaco_);
    });
    return () => {
      // disposers.forEach((d) => d());
    };
  }, []);
  return monaco;
}

export function useMonacoEditor(
  monaco: typeof Monaco | null,
  ref: React.RefObject<HTMLElement>,
  options: Monaco.editor.IStandaloneEditorConstructionOptions,
  initialViewState: null | Monaco.editor.ICodeEditorViewState = null
): Monaco.editor.IStandaloneCodeEditor | null {
  const [editor, setEditor] =
    useState<null | Monaco.editor.IStandaloneCodeEditor>(null);
  useEffect(() => {
    if (monaco && ref.current) {
      const editor_ = monaco.editor.create(ref.current, options);
      initialViewState && editor?.restoreViewState(initialViewState);
      editor_.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
        editor_.getAction("editor.action.formatDocument").run();
      });
      const disposers: Array<() => void> = [];
      setEditor(editor_);
      // @ts-ignore
      // import("monaco-jsx-highlighter").then((x) => {
      //   // const highlighter = new x.default(monaco, j, editor_);
      //   disposers.push(
      //     highlighter.highLightOnDidChangeModelContent(),
      //     highlighter.addJSXCommentCommand()
      //   );
      // });
      return () => {
        editor_.dispose();
        disposers.forEach((fn) => fn());
      };
    }
  }, [monaco, ref.current]);

  useEffect(() => {
    // console.log("them changed", options.theme);
    if (monaco == null) return;
    if (options.theme) {
      monaco.editor.setTheme(options.theme);
    }
    // console.
  }, [options.theme]);

  return editor;
}

export function useTextModelContent(
  monaco: typeof Monaco | null,
  editor: Monaco.editor.IStandaloneCodeEditor | null,
  model: Monaco.editor.ITextModel
): [Monaco.editor.IModel | null, string | null] {
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    if (monaco == null) return;
    if (editor == null) return;
    editor.setModel(model);
    const disposer = editor.onDidChangeModelContent((_ev: any) => {
      setContent(editor.getValue());
    });
    setContent(model.getValue());
    return () => {
      disposer.dispose();
    };
  }, [monaco, editor, model]);
  return [model, content];
}

export function useTextModels() {
  const monaco = useMonaco();
  const [models, setModels] = useState<Monaco.editor.IModel[]>([]);
  useEffect(() => {
    if (monaco == null) return;
    const updateModels = () => {
      const newModels = monaco.editor.getModels();
      setModels(newModels);
    };
    const d1 = monaco.editor.onDidCreateModel(updateModels);
    const d2 = monaco.editor.onWillDisposeModel(updateModels);
    updateModels();
    return () => {
      d1.dispose();
      d2.dispose();
    };
  }, [monaco]);
  return models;
}
