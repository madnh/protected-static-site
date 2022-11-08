import { Request, Response } from 'express'

import { middleware } from '../services/express'

export type Options = {
  checkToken: string | ((token: string) => boolean)
  headerName?: string
  onInvalid?: (req: Request, res: Response) => void
}
export default function headerTokenMiddleware(options: Options) {
  const headerName = options.headerName || 'X-API-KEY'
  return middleware((req, res, next) => {
    const tokenValue = req.header(headerName)

    if (tokenValue) {
      const isValidToken = typeof options.checkToken === 'function' ? options.checkToken(tokenValue) : options.checkToken === tokenValue
      if (isValidToken) {
        next()
        return
      }
    }

    if (options.onInvalid) {
      options.onInvalid(req, res)
    }

    if (!res.headersSent) {
      res.sendStatus(401)
    }
  })
}
