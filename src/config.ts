import { z, ZodType } from 'zod'
import serveHandler from 'serve-handler'
import { Express } from 'express'
import type { Filter, Options } from 'http-proxy-middleware'
import { Middleware } from './services/express'

export const defaultConfigFile = 'serve-di.config.js'
export const defaultConfigFileJson = 'serve-di.config.json'

export type Rewrite = {
  source: string
  destination: string
}
export type ServeHandlerConfig = Parameters<typeof serveHandler>[2]

export type Config = {
  port?: number
  validIps?: Array<string>
  auth?: Array<{
    username: string
    password: string
  }>
  /**
   * Routes to skip authentication
   */
  bypassAuthRoutes?: Array<string>
  proxies?: Record<`/${string}`, string | Filter | Options>
  serve?: ServeHandlerConfig
  logs?: {
    config?: boolean
    url?: boolean
  }

  middlewares?: Array<Middleware>
  custom?: (app: Express, config: Config) => void
}

// JsonConfig is light version of full Config
// But instead of use omit/pick, we defined all of properties, to easy to maintain
export type JsonConfig = {
  $schema?: string
  port?: number
  validIps?: Array<string>
  auth?: Array<{
    username: string
    password: string
  }>
  /**
   * Routes to skip authentication
   */
  bypassAuthRoutes?: Array<string>
  proxies?: Record<`/${string}`, string | Filter | Options>
  serve?: ServeHandlerConfig
  logs?: {
    config?: boolean
    url?: boolean
  }
}

export const JsonConfigSchema = z
  .object({
    $schema: z.string().optional(),
    port: z.number().int().positive().optional(),
    validIps: z.array(z.string()).optional(),
    auth: z
      .array(
        z.object({
          username: z.string(),
          password: z.string(),
        })
      )
      .optional(),
    bypassAuthRoutes: z.array(z.string()).optional(),

    proxies: z.object({}).catchall(z.string()).optional(),
    serve: z
      .object({
        public: z.string(),
        cleanUrls: z.boolean(),
        rewrites: z
          .array(
            z.object({
              source: z.string(),
              destination: z.string(),
            })
          )
          .optional(),
        redirects: z
          .array(
            z.object({
              source: z.string(),
              destination: z.string(),
              type: z.number(),
            })
          )
          .optional(),
        headers: z
          .array(
            z.object({
              source: z.string(),
              headers: z.array(
                z.object({
                  key: z.string(),
                  value: z.string(),
                })
              ),
            })
          )
          .optional(),
        directoryListing: z.union([z.boolean(), z.array(z.string())]).optional(),
        unlisted: z.array(z.string()).optional(),
        trailingSlash: z.boolean().optional(),
        renderSingle: z.boolean().optional(),
        symlinks: z.boolean().optional(),
        etag: z.boolean(),
      })
      .optional(),
    logs: z
      .object({
        url: z.boolean().optional(),
        config: z.boolean().optional(),
      })
      .optional(),
  })
  .strict() satisfies ZodType<JsonConfig>
