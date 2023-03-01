import serveHandler from 'serve-handler'
import express, { Express, Request } from 'express'
import minimatch from 'minimatch'
import { middleware, passThroughMW } from './services/express'
import { log } from './utils'
import type { Filter, Options } from 'http-proxy-middleware'

import headerTokenMiddleware from './middlewares/header-token'
import basicAuthMiddleware from './middlewares/basic-auth'
import logRequestsMiddleware from './middlewares/log-requests'
import filterIpMiddleware from './middlewares/filter-ip'
import { Config, ServeHandlerConfig } from './config'

export { headerTokenMiddleware, basicAuthMiddleware, logRequestsMiddleware, filterIpMiddleware }
export { middleware, passThroughMW }

export function defineConfig(config: Config): Config {
  return config
}

function matchGlob(globs: Array<string>, check: string): string | undefined {
  return globs.find((glob) => glob === check || minimatch(check, glob))
}

function createBypassAuthCb(publicRoutes: string[]) {
  return (req: Request) => {
    const { url } = req
    const glob = matchGlob(publicRoutes, url)

    if (glob) {
      log(`Skip auth by glob: glob=${glob} url=${url}`)
      return false
    }

    return true
  }
}

export function makeServer(config: Config): Express {
  const app = express()

  if (config.logs?.url) {
    log('Add log request middleware')
    app.use(logRequestsMiddleware())
  }

  if (config.custom) {
    log('Apply custom callback')
    config.custom(app, config)
  }

  const enableAuthOption = config.bypassAuthRoutes ? createBypassAuthCb(config.bypassAuthRoutes) : true

  if (config.validIps) {
    log('Add filter ip middleware')
    app.use(filterIpMiddleware({ allowIps: config.validIps, enable: enableAuthOption }))
  }

  if (config.auth) {
    log('Add basic auth middleware')
    app.use(basicAuthMiddleware({ users: config.auth, enable: enableAuthOption }))
  }

  // Add proxies middlewares
  if (config.proxies) {
    log('Load proxy module')
    const { createProxyMiddleware } = require('http-proxy-middleware')

    for (const [proxyPath, context] of Object.entries(config.proxies)) {
      log(`Add proxy for ${proxyPath}`)
      const proxyContext: Filter | Options =
        typeof context === 'string'
          ? {
              target: context,
              changeOrigin: true,
            }
          : context

      app.use(proxyPath, createProxyMiddleware(proxyContext))
    }
  }

  // Add middlewares
  if (config.middlewares && config.middlewares.length) {
    log('Apply middlewares')
    config.middlewares.forEach((middleware) => app.use(middleware))
  }

  const serveConfig: ServeHandlerConfig = {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
    ...(config.serve || {}),
  }

  if (config.logs?.config) {
    log('Serve Config %O', serveConfig)
  }

  app.use((req, res) => {
    serveHandler(req, res, serveConfig)
  })

  // Fallback routes
  app.all('*', (req, res) => {
    res.sendStatus(404)
  })

  return app
}
