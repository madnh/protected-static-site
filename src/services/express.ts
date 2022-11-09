import { NextFunction, Request, Response } from 'express'

export { Request, Response, NextFunction }

export type Middleware = (req: Request, res: Response, next: NextFunction) => any | Promise<any>;

export function passThroughMW(handler?: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (handler) handler(req, res)

    next()
  }
}

export function middleware(cb: Middleware) {
  return (req: Request, res: Response, next: NextFunction) => {
    cb(req, res, next)
  }
}
