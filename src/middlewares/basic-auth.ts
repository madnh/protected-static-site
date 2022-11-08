import { log } from '../utils'
import { IncomingMessage } from 'http'
import basicAuthLib from 'basic-auth'
import { middleware } from '../services/express'

export type UserAuthInfo = { username: string, password: string };

export function findAuthUser(req: IncomingMessage, users: Array<UserAuthInfo>): { username: string } | false {
  const requestCredentials = basicAuthLib(req)
  if (!requestCredentials) return false

  const user = users.find(user => requestCredentials.name === user.username && requestCredentials.pass === user.password)
  return user ? { username: user.username } : false
}

export type Options = false | {
  users: Array<UserAuthInfo>
  realm?: string,
  logs?: {
    user?: boolean
  }
}

export default function basicAuthMiddleware(options: Options) {
  return middleware((req, res, next) => {
    if (!options) {
      next()
      return
    }

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
