import serveHandler from 'serve-handler'
import express, { Express } from 'express'
import { Middleware, middleware, passThroughMW } from './services/express'
import { log } from './utils'

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
    app.use(logRequestsMiddleware())
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
    console.log('Route prefix:', config.routePrefix)
    app.use(config.routePrefix, serveMw)
  } else {
    app.use(serveMw)
  }

  if (config.custom) {
    config.custom(app, config)
  }

  // Fallback routes
  app.all('*', (req, res) => {
    res.sendStatus(404)
  })

  return app
}
