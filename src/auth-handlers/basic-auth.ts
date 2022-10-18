import {CheckAuthHandler} from "../index";
import {log} from "../utils";
import {IncomingMessage} from "http";
import basicAuthLib from "basic-auth";

export type UserAuthInfo = { username: string, password: string };

export function findAuthUser(req: IncomingMessage, users: Array<UserAuthInfo>): { username: string } | false {
  const requestCredentials = basicAuthLib(req)
  if (!requestCredentials) return false

  const user = users.find(user => requestCredentials.name === user.username && requestCredentials.pass === user.password)
  return user ? {username: user.username} : false
}

export type Options = false | {
  users: Array<UserAuthInfo>
  realm?: string,
  logs?: {
    user?: boolean
  }
}
export default function basicAuth(options: Options): CheckAuthHandler {
  return (req, res, send) => {
    if (!options) return true

    const user = findAuthUser(req, options.users)
    if (!user) {
      console.warn('Invalid access')

      send(res, {
        statusCode: 401, headers: {
          'WWW-Authenticate': `Basic realm="${options.realm || 'Auth required'}"`
        }, data: 'Access denied'
      })

      return false
    }

    if(options.logs?.user){
      log(`User: ${user.username}`)
    }

    return true;
  }
}
