# Protected Static Site

- Static Site: use [serve-handler](https://github.com/vercel/serve-handler) package
- Authentication modes:
  - Basic Authentication

## Install

```sh
npm i protected-static-site
```

## Usage

Use `protected-site` command to serve site.

```json
{
  "scripts": {
    "start": "protected-site"
  }
}
```

## Config (optional)

Create `protected-site.js` file at ROOT of your node app.

```js
const { defineSiteServeConfig, basicAuth } = require('protected-static-site')

module.exports = defineSiteServeConfig({
  authHandlers: [
    basicAuth({
      users: [
        { username: 'a', password: '123123' },
        { username: 'b', password: '456' },
      ],
    }),
  ],
  isRequireAuth: [/^\/admin/], // Protect any /admin* routes
  serveHandler: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
  },
  logs: {
    url: true,
    config: true,
  },
})
```

### Configuration

```ts
{
    port?: number;
    isRequireAuth?: false | Array<string | RegExp> | ((req: IncomingMessage, url: string) => boolean)
    authHandlers?: Array<(req: IncomingMessage, res: ServerResponse, send: Send) => boolean>
    serveHandler?: ServeHandlerConfig;
    logs?: {
        config?: boolean;
        url?: boolean;
    };
}
```

`ServeHandlerConfig` is config of [serve-handler](https://github.com/vercel/serve-handler), refer to its config for detail.
