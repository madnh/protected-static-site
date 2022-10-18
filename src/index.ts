#!/usr/bin/env node
import http, { IncomingMessage, ServerResponse } from 'http'
import serveHandler from 'serve-handler'
import { log, Send, send } from './utils'
import basicAuth from './auth-handlers/basic-auth'

export type ServeHandlerConfig = Parameters<typeof serveHandler>[2]
export type IsRequireAuth = Array<string | RegExp> | ((req: IncomingMessage, url: string) => boolean)
export type CheckAuthHandler = (req: IncomingMessage, res: ServerResponse, send: Send) => boolean
export type Config = {
  port?: number
  isRequireAuth?: false | IsRequireAuth
  authHandlers?: Array<CheckAuthHandler>
  serveHandler?: ServeHandlerConfig
  logs?: {
    config?: boolean
    url?: boolean
  }
}

export { basicAuth }

export function defineSiteServeConfig(config: Config): Config {
  return config
}

export function auth(check: CheckAuthHandler): CheckAuthHandler {
  return check
}

export function checkRequireAuth(url: string, req: IncomingMessage, isRequireAuth: IsRequireAuth): boolean {
  if (Array.isArray(isRequireAuth)) {
    return isRequireAuth.some((check) => {
      if (check instanceof RegExp) return check.test(url)
      return check === url
    })
  }
  return isRequireAuth(req, url)
}

export function makeServer(config: Config) {
  const serveConfig: ServeHandlerConfig = {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
    ...(config.serveHandler || {}),
  }

  if (config.logs?.config) {
    log('Serve Config %O', serveConfig)
  }
  const requireAuth = !!config.authHandlers && config.authHandlers?.length > 0 && config.isRequireAuth !== false
  if (!requireAuth) {
    console.warn('Site is public access')
  }

  return new http.Server((req, res) => {
    const url = String(req.url || '').trim()
    if (config.logs?.url) {
      console.log('URL:', url)
    }

    // Check Auth Handlers
    if (requireAuth) {
      const isProtectRoute = config.isRequireAuth === false ? false : config.isRequireAuth === undefined || checkRequireAuth(url, req, config.isRequireAuth)
      if (isProtectRoute) {
        const authHandlers = config.authHandlers || []

        for (const handler of authHandlers) {
          if (!handler(req, res, send)) {
            if (!res.headersSent) {
              send(res, {
                statusCode: 401,
                data: 'Access denied',
              })
            }
            return
          }
        }
      }
    }

    // Serve site
    serveHandler(req, res, serveConfig)
  })
}
