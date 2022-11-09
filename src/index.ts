import serveHandler from 'serve-handler'
import express, { Express } from 'express'
import { Middleware, middleware, passThroughMW } from './services/express'
import { log } from './utils'
import type { Filter, Options } from 'http-proxy-middleware'

import headerTokenMiddleware from './middlewares/header-token'
import basicAuthMiddleware from './middlewares/basic-auth'
import logRequestsMiddleware from './middlewares/log-requests'


export { headerTokenMiddleware, basicAuthMiddleware, logRequestsMiddleware }
export { middleware, passThroughMW }

export type ServeHandlerConfig = Parameters<typeof serveHandler>[2]
export type Config = {
  port?: number
  routePrefix?: string
  middlewares?: Array<Middleware>
  proxies?: Record<`/${string}`, string | Filter | Options>
  serveHandler?: ServeHandlerConfig
  custom?: (app: Express, config: Config) => void
  logs?: {
    config?: boolean
    url?: boolean
  }
}

export function defineConfig(config: Config): Config {
  return config
}

export function makeServer(config: Config): Express {
  const app = express()

  // Add middlewares
  if (config.middlewares && config.middlewares.length) {
    log('Apply middlewares')
    config.middlewares.forEach(middleware => app.use(middleware))
  }

  if (config.logs?.url) {
    log('Add log request middleware')
    app.use(logRequestsMiddleware())
  }

  if (config.custom) {
    log('Apply custom callback')
    config.custom(app, config)
  }

  // Add proxies middlewares
  if (config.proxies) {
    log('Load proxy module')
    const { createProxyMiddleware } = require('http-proxy-middleware')

    for (const [proxyPath, context] of Object.entries(config.proxies)) {
      log(`Add proxy for ${proxyPath}`)
      const proxyContext: Filter | Options = typeof context === 'string' ? {
        target: context,
        changeOrigin: true
      } : context

      app.use(proxyPath, createProxyMiddleware(proxyContext))
    }
  }

  const serveConfig: ServeHandlerConfig = {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
    ...(config.serveHandler || {})
  }

  if (config.logs?.config) {
    log('Serve Config %O', serveConfig)
  }

  const serveMw: Middleware = (req, res) => {
    serveHandler(req, res, serveConfig)
  }

  if (config.routePrefix) {
    log('Route prefix:', config.routePrefix)
    app.use(config.routePrefix, serveMw)
  } else {
    app.use(serveMw)
  }

  // Fallback routes
  app.all('*', (req, res) => {
    res.sendStatus(404)
  })

  return app
}
