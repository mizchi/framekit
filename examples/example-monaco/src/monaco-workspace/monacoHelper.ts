import path from "path-browserify";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { ensureMonaco } from "./useMonaco";
import type Monaco from "monaco-editor";

// @ts-ignore
globalThis.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

export async function setupMonaco(
  monaco: typeof Monaco,
  opts: {
    format?: (content: string, filepath: string) => Promise<string>;
  } = {}
) {
  monaco.languages.typescript.typescriptDefaults.getEagerModelSync();
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowSyntheticDefaultImports: true,
    target: monaco.languages.typescript.ScriptTarget.Latest,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    resolveJsonModule: true,
    baseUrl: ".",
    paths: {
      "https://*": ["file:///@types/*"],
      "*": ["file:///@types/*"],
    },
    typeRoots: ["node_modules/@types", "/@types"],
  });

  if (opts.format) {
    monaco.languages.registerDocumentFormattingEditProvider("typescript", {
      async provideDocumentFormattingEdits(model) {
        const text = await opts.format!(model.getValue(), model.uri.path);
        return [
          {
            range: model.getFullModelRange(),
            text,
          },
        ];
      },
    });

    monaco.languages.registerDocumentFormattingEditProvider("html", {
      async provideDocumentFormattingEdits(model) {
        const text = await opts.format!(model.getValue(), model.uri.path);
        return [
          {
            range: model.getFullModelRange(),
            text,
          },
        ];
      },
    });
  }

  // ignore .svelte
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    'declare module "*.svelte";'
  );
}

const extToLang = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".html": "html",
  ".svelte": "html",
  ".css": "css",
};
export async function updateTextModel(initaialCode: string, filepath: string) {
  const monaco = await ensureMonaco();

  const models = monaco.editor.getModels();
  let model = models.find((m) => m.uri.toString() === filepath);
  if (model) {
    model.setValue(initaialCode);
  } else {
    const extname = path.extname(filepath) as any;
    // @ts-ignore
    const lang = extToLang[extname];
    model = monaco.editor.createModel(
      initaialCode,
      lang ?? undefined,
      monaco.Uri.parse(filepath)
    );
  }
  model.updateOptions({
    tabSize: 2,
  });
  return model;
}

export async function deleteTextModel(filepath: string) {
  const monaco = await ensureMonaco();

  const models = monaco.editor.getModels();
  models.find((m) => m.uri.toString() === filepath)?.dispose();
}

export async function getCurrentContents(
  files: Array<{ filepath: string; open: boolean }>
): Promise<Array<{ filepath: string; content: string; open: boolean }>> {
  const monaco = await ensureMonaco();
  const models = monaco.editor.getModels();
  const contents = files.map((f) => {
    const m = models.find((m) => m.uri.path === f.filepath);
    return {
      filepath: f.filepath,
      content: m!.getValue(),
      open: f.open,
    };
  });
  return contents;
}
