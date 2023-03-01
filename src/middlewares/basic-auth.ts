import { log } from '../utils'
import { IncomingMessage } from 'http'
import basicAuthLib from 'basic-auth'
import { middleware, Request } from '../services/express'

export type UserAuthInfo = { username: string; password: string }

export function findAuthUser(req: IncomingMessage, users: Array<UserAuthInfo>): { username: string } | false {
  const requestCredentials = basicAuthLib(req)
  if (!requestCredentials) return false

  const user = users.find((user) => requestCredentials.name === user.username && requestCredentials.pass === user.password)
  return user ? { username: user.username } : false
}

export type Options = {
  enable?: boolean | ((req: Request) => boolean)
  users: Array<UserAuthInfo>
  realm?: string
  logs?: {
    user?: boolean
  }
}

export default function basicAuthMiddleware(options: Options) {
  const useOptions: Options = {
    enable: true,
    realm: 'Auth required',

    ...options,
  }

  if (useOptions.enable === false) {
    console.warn('Basic authentication is disabled')
  } else if (useOptions.enable === true) {
    console.info('Basic authentication is enabled')
  } else if (typeof useOptions.enable === 'function') {
    console.warn('Basic authentication enabled, but will check by route')
  }

  return middleware((req, res, next) => {
    if (useOptions.enable === false) {
      return next()
    }
    if (typeof useOptions.enable === 'function') {
      if (useOptions.enable(req) === false) {
        console.warn(`[Basic authentication] skip for route: '${req.url}`)
        return next()
      }
    }

    // Apply check auth
    const user = findAuthUser(req, useOptions.users)
    if (!user) {
      console.warn('Invalid access')

      res.status(401)
      res.setHeader('WWW-Authenticate', `Basic realm="${useOptions.realm}"`)
      res.send('Access denied')
      return
    }

    if (useOptions.logs?.user) {
      log(`User: ${user.username}`)
    }

    next()
  })
}
