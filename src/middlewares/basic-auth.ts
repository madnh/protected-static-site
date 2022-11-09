import { log } from '../utils'
import { IncomingMessage } from 'http'
import basicAuthLib from 'basic-auth'
import { middleware, passThroughMW, Request } from '../services/express'

export type UserAuthInfo = { username: string, password: string };

export function findAuthUser(req: IncomingMessage, users: Array<UserAuthInfo>): { username: string } | false {
  const requestCredentials = basicAuthLib(req)
  if (!requestCredentials) return false

  const user = users.find(user => requestCredentials.name === user.username && requestCredentials.pass === user.password)
  return user ? { username: user.username } : false
}

export type Options = {
  enable?: boolean
  users: Array<UserAuthInfo>
  realm?: string,
  logs?: {
    user?: boolean
  },
  match?: RegExp | ((url: string, req: Request) => boolean)
}

export default function basicAuthMiddleware(options: Options) {
  if (options.enable === false) {
    console.warn('Basic authentication is disabled')
    return passThroughMW()
  } else {
    console.info('Basic authentication is enabled')
  }

  return middleware((req, res, next) => {
    let isNeedAuth = true

    if (options.match) {
      const url = req.url

      if (options.match instanceof RegExp) {
        isNeedAuth = options.match.test(url)
      } else {
        isNeedAuth = options.match(url, req)
      }
    }

    if (!isNeedAuth) {
      next()
      return
    }

    // Apply check auth
    const user = findAuthUser(req, options.users)
    if (!user) {
      console.warn('Invalid access')

      res.status(401)
      res.setHeader('WWW-Authenticate', `Basic realm="${options.realm || 'Auth required'}"`)
      res.send('Access denied')
      return
    }

    if (options.logs?.user) {
      log(`User: ${user.username}`)
    }

    next()
  })
}
