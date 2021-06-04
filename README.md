# Framekit

Make iframe(or portal) widget with API client.

```
$ npm install @mizchi/framekit comlink
```

## Core Idea

Today's static web apps are complex relative urls to run and difficult to mix if they use another build process. I think iframe widget resolve this problem.

Iframe widget is old traditional method on web. But it's difficult to control from host and nowadays iframe sandbox becomes more strict for privacy.

So I think bare iframe with explicit API.

`framekit` provides api client for iframe. comlink helps this. see https://github.com/GoogleChromeLabs/comlink/tree/master/docs/examples/99-nonworker-examples/iframes

If we can use, Portals make this approach greater.

[Hands-on with Portals: seamless navigation on the web](https://web.dev/hands-on-portals/)

## Workflows

- Deploy app as static site with exposed rpc.
- Connect app with iframe and create rpc client. Call iframe rpc from host.

## Example: client

Declare api types

```ts
// api.d.ts
import type { ApiBase } from "@mizchi/framekit";

export interface Api extends ApiBase {
  init(base: number, callback: (now: number) => void): Promise<void>;
}
```

Implement iframe content

```ts
// src/index.ts
import type { Api } from "../api";
import { exposeIframe } from "@mizchi/framekit";

export const api: Api = {
  async init(base: number, callback: (now: number) => void) {
    setInterval(() => {
      const delta = Date.now() - base;
      document.body.innerHTML = delta.toString();
      callback(delta);
    }, 1000);
  },
  async __ready__() {
    // required: detect ready
    return true;
  },
  async __standalone__() {
    // required: at host
    api.init(0, console.log);
  },
};

exposeIframe(api);
```

`__ready__` is required for initialize rpc.
`__standalone__` is required for non iframe entrypoint

(See full code on `examples/example-vite`)

Deploy static site

```bash
$ npm i -g netlify-cli
$ yarn build # generate app
$ netlify deploy --prod -d app
```

Optional: Deploy your rpc types to npm.

## Example: Host Client

```ts
import { create } from "@mizchi/framekit";
import { proxy } from "comlink";

// refer your api types
import type Api from "../api";

(async () => {
  // create iframe element and renderer
  const { element, render } = await create({
    url: "<your-deployed-url>",
  });
  // set size of iframe
  element.style.width = "160px";
  element.style.height = "40px";
  element.style.outline = "1px solid black";

  // get api instance from result of render
  // it ensures iframe is loaded and connect.
  const api = await render(document.body);

  await api.init(
    // transferrable object
    Date.now(),
    // wrap function with comlink.proxy for function
    proxy((delta) => {console.log('delta', delta)
  }));
})().catch(console.error);
```

## TODO

- Check semver range on connect
- Portal example
- React Wrapper
- Svelte Wrapper
- Vue Wrapper

## LICENSE

MIT