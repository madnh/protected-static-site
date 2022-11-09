import fs from 'fs'
import debug from 'debug'

export const log = debug('serve-di')

export function tryImport<T>(file: string): { exists: false, content: undefined, error: false } | { exists: true, content: T, error: false } | { exists: true, content: undefined, error: any | Error } {
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      content: undefined,
      error: false
    }
  }
  try {
    const content = require(file)
    return {
      exists: true,
      content: content,
      error: false
    }
  } catch (error) {
    return {
      exists: true,
      content: undefined,
      error: error
    }
  }
}
