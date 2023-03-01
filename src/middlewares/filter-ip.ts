import { middleware, Request } from '../services/express'

import { Netmask } from 'netmask'
import * as requestIp from 'request-ip'

function findValidIp(whiteListIp: Array<string>, clientIP: string): string | undefined {
  return whiteListIp.find((ip) => {
    if (!ip.includes('/')) return ip === clientIP

    // Check subnet
    try {
      const block = new Netmask(ip)
      return block.contains(clientIP)
    } catch (e) {
      console.warn(`IP source is invalid: ${ip}, ${e}`)
    }

    return false
  })
}
export type Options = {
  enable?: boolean | ((req: Request) => boolean)
  allowIps: Array<string>
}

export default function filterIpMiddleware(options: Options) {
  const useOptions: Options = {
    enable: true,

    ...options,
  }

  if (useOptions.enable === false) {
    console.warn('Filter IP Middleware is disabled')
  } else if (useOptions.enable === true) {
    console.info('Filter IP Middleware is enabled')
  } else {
    console.warn('Filter IP Middleware enabled, but will check by route')
  }

  return middleware((req, res, next) => {
    if (useOptions.enable === false) {
      return next()
    }
    if (typeof useOptions.enable === 'function') {
      if (useOptions.enable(req) === false) {
        console.warn(`[Filter IP Middleware] skip for route: '${req.url}`)
        return next()
      }
    }

    // Apply check auth
    const clientIp = requestIp.getClientIp(req)
    const userAgent = req.header('user-agent')

    if (!clientIp) {
      console.warn('Unable to detect client IP address')
      console.log('User-Agent: ', userAgent)

      res.sendStatus(403)
      return
    }

    const matchIP = findValidIp(useOptions.allowIps, clientIp)

    if (!matchIP) {
      console.warn(`Invalid Access: ${clientIp}`)
      console.log('User-Agent: ', userAgent)

      res.sendStatus(403)
      return
    }

    console.log('Valid IP:', clientIp, 'Match:', matchIP)
    next()
  })
}
