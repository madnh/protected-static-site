# serve-di

Serve static site with useful features.

- Base on [ExpressJS](http://expressjs.com/)
- Written in Typescript
- Use [serve-handler](https://github.com/vercel/serve-handler) package to serve static assets
- Builtin middlewares:
  - Authentication by token in header
  - Basic Authentication
  - Filter access by IP, netmask
  - Log requests
  - Proxy paths
- Use custom config file: in JS or JSON formats
- Generate init command

## Install

### Global

```sh
npm i -g serve-di
```

### In project

```sh
npm i serve-di
```

### NPX style

```sh
npx serve-di
```

## Usage

### CLI commands

| Command       | Description        |
| ------------- | ------------------ |
| `serve`       | Serve site         |
| `init-config` | Init sample config |

Use `serve-di serve` command to serve site.

```sh
serve-di serve
npx serve-di serve
```

As NPM script

```json
{
  "scripts": {
    "start": "serve-di serve"
  }
}
```

#### Main CLI

```plain
sserve-di/0.0.15

Usage:
  $ serve-di

Commands:

  init-config        Init config file
  serve [serveDir]  Serve site

For more info, run any command with the `--help` flag:
  $ serve-di --help
  $ serve-di init-config --help
  $ serve-di serve --help

Options:
  -v, --version  Display version number
  -h, --help     Display this message
```

#### `serve`

```plain
serve-di/0.0.13

Usage:
  $ serve-di serve [serveDir]

Options:
  --config <file>               Config file
  --port <port>                 Listening port
  --route-prefix <routePrefix>  Route prefix
  --verbose                     Print verbose logging
  --noAuth                      Disable auth middlewares if exists in config file: basic auth and filter IP
  -h, --help                    Display this message
```

## Programing

```typescript
import { Config, makeServer } from 'serve-di'

const port = process.env.PORT || 8080
const config: Config = {
  // ...
}

makeServer(config).listen(port, () => {
  console.log(`Listening at: http://localhost:${port}${config.routePrefix}`)
})
```

## Configuration

You can use custom file to config module, support JSON and JS config. Detail of each type of config file please see below sections.

Create `serve-di.config.json` or `serve-di.config.js` file at ROOT of your node app.

**JS config file**

[`serve-di.config.js`](./stubs/sample.js)

```js
const { defineConfig } = require('serve-di')

module.exports = defineConfig({
  auth: [{ username: 'A', password: 'b' }],
  serve: {
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

**JS config file**

[`serve-di.config.json`](./stubs/sample.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/madnh/serve-di/master/schema.json",
  "auth": [{ "username": "A", "password": "B" }],
  "serve": {
    "public": "dist",
    "etag": true,
    "cleanUrls": true,
    "directoryListing": false,
    "trailingSlash": true
  }
}
```

`serve` field is config of [serve-handler](https://github.com/vercel/serve-handler), refer to its config for
detail.

#### JSON config version

JSON config file only contains basic configs:

```typescript
type JsonConfig = {
  $schema?: string // Just link of JSON config schema file
  port?: number
  /**
   * List of validated IP, support IPv4 only, can be range of IPv4.
   * @example
   *   ['1.2.3.4', '2.3.4.5/27']
   */
  validIps?: string[]

  /**
   * Basic Auth info
   */
  auth?: Array<{
    username: string
    password: string
  }>
  proxies?: Record<`/${string}`, string>
  serve?: ServeConfig
  logs?: {
    config?: boolean
    url?: boolean
  }
}
```

#### Default configs

```typescript
const config: Config = {
  serve: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
  },
}
```

## Proxy

Use [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) to add proxy middleware.

Remember to install `http-proxy-middleware`.

```sh
npm i http-proxy-middleware
```

Config:

```typescript
const config: Config = {
  proxies: {
    '/api': {
      target: 'https://api.site.com',
      changeOrigin: true,
    },
    '/api2': 'http://localhost:3000/',
  },
}
```

```json
{
  "proxies": {
    "/api": "https://api.site.com",
    "/api2": "http://localhost:3000/"
  }
}
```

Prefer to its document for more detail.
