import { middleware, passThroughMW } from '../services/express'

import { Netmask } from 'netmask'
import * as requestIp from 'request-ip'

function findValidIp(whiteListIp: Array<string>, clientIP: string): string | undefined {
  return whiteListIp.find((ip) => {
    if (!ip.includes('/')) return ip === clientIP

    // Check subnet
    try {
      const block = new Netmask(ip)

      try {
        return block.contains(clientIP)
      } catch (e) {
        return false
      }
    } catch (e) {
      console.warn(`IP source is invalid: ${ip}, ${e}`)
    }

    return false
  })
}
export type Options = {
  enable?: boolean
  allowIps: Array<string>
}

export default function filterIpMiddleware(options: Options) {
  if (options.enable === false) {
    console.warn('Filter IP Middleware is disabled')
    return passThroughMW()
  } else {
    console.info('Filter IP Middleware is enabled')
  }

  return middleware((req, res, next) => {
    const clientIp = requestIp.getClientIp(req)
    const userAgent = req.header('user-agent')

    if (!clientIp) {
      console.warn('Unable to detect client IP address')
      console.log('User-Agent: ', userAgent)

      res.sendStatus(403)
      return
    }

    const matchIP = findValidIp(options.allowIps, clientIp)

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
