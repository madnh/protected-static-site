import { NextFunction, Request, Response } from 'express'

export type Middleware = (req: Request, res: Response, next: NextFunction) => any | Promise<any>;

export function middleware(cb: Middleware) {
  return (req: Request, res: Response, next: NextFunction) => {
    cb(req, res, next)
  }
}
