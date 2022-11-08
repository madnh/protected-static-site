# serve-di

Serve static site with useful features.

- Base on [ExpressJS](http://expressjs.com/)
- Written in Typescript
- Use [serve-handler](https://github.com/vercel/serve-handler) package to serve static assets
- Builtin middlewares:
    - Authentication by token in header
    - Basic Authentication
    - Log requests
- Use custom config file

## Install

```sh
npm i serve-di
```

## Usage
### CLI commands

| Command | Description        | 
|---------|--------------------|
| `serve` | Serve site         |
| `init`  | Init sample config |

Use `serve-di serve` command to serve site.

```json
{
  "scripts": {
    "start": "serve-di serve"
  }
}
```

```plain
❯  serve-di --help
serve-di/0.0.1

Usage:
  $ serve-di

Commands:

  serve
  init

For more info, run any command with the `--help` flag:
  $ serve-di --help
  $ serve-di serve --help
  $ serve-di init --help

Options:
  -v, --version  Display version number
  -h, --help     Display this message
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
  serveHandler: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true
  },
  logs: {
    url: true,
    config: true
  }
})

```

### Configuration

```typescript
type Config = {
  port?: number
  routePrefix?: string
  middlewares?: Array<Middleware>
  serveHandler?: ServeHandlerConfig
  custom?: (context: { app: Express, router: Router }) => void
  logs?: {
    config?: boolean
    url?: boolean
  }
}
```

`ServeHandlerConfig` is config of [serve-handler](https://github.com/vercel/serve-handler), refer to its config for
detail.


### Default configs

```typescript
const config: Config = {
  serveHandler: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
  }
}
```
