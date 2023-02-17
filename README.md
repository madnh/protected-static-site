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

| Command        | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| `serve`        | Serve site                                                      |
| `init-config`  | Init sample config                                              |

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
sserve-di/0.0.14

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
serve-di/0.0.10

Usage:
  $ serve-di serve [publicDir]

Options:
  --config <file>               Config file 
  --port <port>                 Listening port 
  --route-prefix <routePrefix>  Route prefix 
  --verbose                     Print verbose logging 
  -h, --help                    Display this message 
```

### Programing

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

## Configuration (optional)

Create `serve-di.config.js` file at ROOT of your node app.

```js
const { defineConfig } = require('serve-di')

module.exports = defineConfig({
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

### Configuration

```typescript
import type { Filter, Options } from 'http-proxy-middleware'
type Config = {
  port?: number
  middlewares?: Array<Middleware>
  proxies?: Record<`/${string}`, string | Filter | Options>
  serve?: serveConfig
  custom?: (context: { app: Express; router: Router }) => void
  logs?: {
    config?: boolean
    url?: boolean
  }
}
```

`serveConfig` is config of [serve-handler](https://github.com/vercel/serve-handler), refer to its config for
detail.

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

Prefer to its document for more detail.
