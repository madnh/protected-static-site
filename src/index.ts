import serveHandler from 'serve-handler'
import express, { Express, Router } from 'express'
import { Middleware } from './services/express'
import { log } from './utils'

import headerTokenMiddleware from './middlewares/header-token'
import basicAuthMiddleware from './middlewares/basic-auth'
import logRequestsMiddleware from './middlewares/log-requests'

export { headerTokenMiddleware, basicAuthMiddleware, logRequestsMiddleware }

export type ServeHandlerConfig = Parameters<typeof serveHandler>[2]
export type Config = {
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

export function defineConfig(config: Config): Config {
  return config
}

export function makeServer(config: Config): Express {
  const app = express()
  const router = Router()

  if (config.logs?.url) {
    app.use(logRequestsMiddleware())
  }
// Add middlewares
  if (config.middlewares && config.middlewares.length) {
    config.middlewares.forEach(middleware => app.use(middleware))
  }

  // Add routers
  if (config.routePrefix) {
    console.log('Route prefix:', config.routePrefix)
    app.use(config.routePrefix, router)
  } else {
    app.use(router)
  }

  // Fallback routes
  app.all('*', (req, res) => {
    res.sendStatus(404)
  })

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

  router.use((req, res) => {
    serveHandler(req, res, serveConfig)
  })

  if (config.custom) {
    config.custom({ app, router })
  }

  return app
}
