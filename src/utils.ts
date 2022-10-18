import {ServerResponse} from "http"
import debug from "debug";

export const log = debug('site-serve')

export function tryImport<T>(file: string): { exists: false, content: undefined } | { exists: true, content: T } {
  try {
    const content = require(file)
    return {
      exists: true,
      content: content
    }
  } catch (error) {
    return {
      exists: false,
      content: undefined
    }
  }
}

export type SendOptions = { statusCode: number, headers?: Record<string, number | string | ReadonlyArray<string>>, data?: any };

export function send(res: ServerResponse, {statusCode, headers, data}: SendOptions): ServerResponse {
  res.statusCode = statusCode

  if (headers) {
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value))
  }

  res.end(data)
  return res
}

export type Send = typeof send
