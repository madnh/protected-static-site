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
