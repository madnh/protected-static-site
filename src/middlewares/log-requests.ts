import { middleware } from '../services/express'

export default function logRequestsMiddleware() {
  return middleware((req, res, next) => {
    console.log(req.method.toUpperCase(), req.path)
    next()
  })
}
