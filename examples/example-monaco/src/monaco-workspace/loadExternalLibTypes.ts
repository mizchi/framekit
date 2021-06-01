import type * as Monaco from "monaco-editor";
// import { getTypes } from "../pages/api/types";
import path from "path-browserify";
import { kvsIndexedDB } from "@kvs/indexeddb";
import ts from "typescript";
type Ctx = {
  monaco: typeof Monaco;
  extractImportSpecifiers: (code: string) => Promise<string[]>;
};
type EntryCache =
  | {
      code: string;
      typeUrl: string;
      hasTypes: true;
      cachedAt: number;
    }
  | {
      hasTypes: false;
      cachedAt: number;
    };

type DependencyCache = {
  code: string;
  cachedAt: number;
};

let _entryCache: {
  has: (k: string) => Promise<boolean>;
  get: (k: string) => Promise<EntryCache | void>;
  set: (k: string, data: EntryCache) => Promise<void>;
  delete: (k: string) => Promise<void>;
};

let _depsCache: {
  has: (k: string) => Promise<boolean>;
  get: (k: string) => Promise<DependencyCache | void>;
  set: (k: string, data: DependencyCache) => Promise<void>;
  delete: (k: string) => Promise<void>;
};

export async function loadExternalLibTypes({
  monaco,
  code,
  extractImportSpecifiers,
  onLog,
}: {
  monaco: typeof Monaco;
  code: string;
  extractImportSpecifiers: (code: string) => Promise<string[]>;
  onLog(message: string): void;
}) {
  const urls = await extractImportSpecifiers!(code);
  const externalModules = urls
    .filter((t) => !t.startsWith(".") && !done.has(t))
    .map((t) => {
      if (!t.startsWith("https://")) {
        return {
          url: `https://cdn.esm.sh/${t}`,
          registerName: t,
        };
      } else {
        return {
          url: t,
          registerName: t,
        };
      }
    });
  if (externalModules.length === 0) return;

  for (const mod of externalModules) {
    const ret = await startFetch({
      ctx: {
        monaco,
        extractImportSpecifiers,
      },
      registerName: mod.registerName,
      url: mod.url,
    });
    onLog(`${mod.registerName} loaded`);
  }
}

type TypeQueue =
  | { type: "entry"; registerName: string; url: string }
  | { type: "dependency"; url: string };

let queue: Array<TypeQueue> = [];
let done = new Set();

async function startFetch({
  ctx,
  registerName,
  url,
}: {
  ctx: Ctx;
  registerName: string;
  url: string;
}) {
  let next: TypeQueue | void = {
    type: "entry",
    registerName,
    url,
  };
  let cycle = 0;
  let skipCount = 0;
  const monacoChunks: Array<{ uri: string; code: string }> = [];
  do {
    console.log("cycle", cycle);

    cycle++;
    let chunk: { uri: string; code: string } | void;
    if (next.type === "entry") {
      chunk = await fetchEntryType({ registerName, url: url });
    } else {
      chunk = await fetchDependencyType({ url: next.url });
    }
    if (chunk) {
      monacoChunks.push(chunk);
    } else {
      skipCount++;
      console.log("skipped", next.url);
      continue;
    }
    const urls = await ctx.extractImportSpecifiers(chunk.code);
    urls.forEach((u) => {
      if (queue.findIndex((t) => t.url === u) > -1) return;
      if (u.startsWith("https://")) {
        queue.push({
          type: "dependency",
          url: u,
        });
      } else {
        queue.push({
          type: "entry",
          url: `https://cdn.esm.sh/${u}`,
          registerName: u,
        });
      }
    });
  } while ((next = queue.pop()));
  console.log("finish: chunks", monacoChunks.length, "skipped", skipCount);

  for (const chunk of monacoChunks) {
    ctx.monaco.languages.typescript.typescriptDefaults.addExtraLib(
      chunk.code,
      chunk.uri
    );
  }

  return {
    cycle,
    skipCount,
  };
}

async function fetchEntryType({
  registerName,
  url,
}: {
  registerName: string;
  url: string;
}): Promise<{ code: string; uri: string } | void> {
  if (done.has(url)) return;
  done.add(url);
  done.add(registerName);

  let entry = await ensureEntry(url);
  if (entry.hasTypes) {
    console.log("[register entry]", registerName, "=>", entry.typeUrl);
    return {
      code: entry.code,
      uri: makeSymbol(registerName),
    };
  } else {
    console.log(`${url} has no type code`);
    return;
  }
}

async function fetchDependencyType({
  url: url,
}: {
  url: string;
}): Promise<{ code: string; uri: string } | void> {
  if (done.has(url)) return;
  done.add(url);

  const { pathname, host } = new URL(url);
  const localUri = `file:///@types/${host}${pathname}`;
  const dependency = await ensureDependency(url);
  console.log(`[register deps] ${url}`);
  // return dependency.code;
  return { code: dependency.code, uri: localUri };
}

const makeSymbol = (expr: string) => {
  if (expr.startsWith("https://")) {
    const { host, pathname } = new URL(expr);
    const rel = path.join(host, pathname);
    if (rel.endsWith(".d.ts")) {
      return `file:///@types/${rel}`;
    } else {
      return `file:///@types/${rel}.d.ts`;
    }
  } else {
    return `file:///@types/${expr}/index.d.ts`;
  }
};

async function ensureEntryCache() {
  return (
    _entryCache ??
    (_entryCache = (await kvsIndexedDB<any>({
      name: "type:v4",
      version: 1,
    })) as any)
  );
}

async function ensureDependencyCache() {
  return (
    _depsCache ??
    (_depsCache = (await kvsIndexedDB<any>({
      name: "type-deps:v4",
      version: 1,
    })) as any)
  );
}

async function ensureEntry(url: string): Promise<EntryCache> {
  const cache = await ensureEntryCache();
  let cached = await cache.get(url);

  // check expired
  if (cached && cached.cachedAt - Date.now() > 86480 * 10000) {
    // expired
    cache.delete(url);
    cached = undefined;
  }

  if (cached && cached.hasTypes) {
    console.log("Use entry cache", url);
    return cached;
  } else {
    console.log("Fetch entry cache", url);
    // @ts-ignore
    const type = await getTypes({
      url,
    });
    if (type.hasTypes) {
      const code = await fetch(type.url).then((res) => res.text());
      const transformed = transformWithCdnHost(code, type.url);
      const newCache: EntryCache = {
        code: transformed,
        hasTypes: true,
        typeUrl: type.url,
        cachedAt: Date.now(),
      };
      console.log("save new", transformed);
      cache.set(url, newCache);
      return newCache;
    } else {
      const newCache: EntryCache = {
        hasTypes: false,
        cachedAt: Date.now(),
      };
      await cache.set(url, newCache);
      return {
        hasTypes: false,
        cachedAt: Date.now(),
      };
    }
  }
}

async function ensureDependency(url: string): Promise<DependencyCache> {
  const depsCache = await ensureDependencyCache();
  const cache = await depsCache.get(url);
  if (cache) {
    // console.log("Use dep cache", url, cache.code);
    return cache;
  } else {
    console.log("Fetch dep cache", url);

    const depCode = await fetch(url).then((res) => res.text());
    const rewroteCode = transformWithCdnHost(depCode, url);
    const newDepsCache: DependencyCache = {
      code: rewroteCode,
      cachedAt: Date.now(),
    };
    await depsCache.set(url, newDepsCache);
    return newDepsCache;
  }
}

const printer = ts.createPrinter();
function transformWithCdnHost(code: string, url: string): string {
  const s = ts.createSourceFile(url, code, ts.ScriptTarget.Latest);
  const xs = ts.transform(s, [cdnTransformer(url)]);
  const out = printer.printFile(xs.transformed[0]);
  return out;
}

const cdnTransformer: (url: string) => ts.TransformerFactory<ts.SourceFile> =
  (url: string) => (_context: ts.TransformationContext) => {
    let rootSource: ts.SourceFile;

    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        if (node.importClause == null) {
          return node;
        }
        const specifierRaw = node.moduleSpecifier.getText(rootSource);
        const specifier = specifierRaw.slice(1, specifierRaw.length - 1);
        if (specifier.startsWith(".")) {
          const { host, pathname, protocol } = new URL(url);
          const rel = path.resolve(
            pathname.endsWith(".d.ts") ? path.dirname(pathname) : pathname,
            specifier
          );
          const newUrl = `${protocol}//${host}${rel}`;
          return ts.factory.createImportDeclaration(
            node.decorators,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(newUrl)
          );
        }

        if (specifier.startsWith("/")) {
          return ts.factory.createImportDeclaration(
            node.decorators,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(`https://cdn.esm.sh${specifier}`)
          );
        }
        return node;
      }

      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier == null) return node;
        const specifierRaw = node.moduleSpecifier.getText(rootSource);
        const specifier = specifierRaw.slice(1, specifierRaw.length - 1);

        if (specifier.startsWith(".")) {
          const { host, pathname, protocol } = new URL(url);
          const rel = path.resolve(
            pathname.endsWith(".d.ts") ? path.dirname(pathname) : pathname,
            specifier
          );
          const newUrl = `${protocol}//${host}${rel}`;
          return ts.factory.createExportDeclaration(
            node.decorators,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            ts.factory.createStringLiteral(newUrl)
          );
        }

        if (specifier.startsWith("/")) {
          return ts.factory.createExportDeclaration(
            node.decorators,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            ts.factory.createStringLiteral(`https://cdn.esm.sh${specifier}`)
          );
        }
        return node;
      }
      return node;
    };
    return (source: ts.SourceFile) => {
      rootSource = source;
      return ts.factory.updateSourceFile(
        source,
        ts.visitNodes(source.statements, visit)
      );
    };
  };
