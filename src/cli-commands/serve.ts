import { CAC } from 'cac'
import path from 'path'
import * as fs from 'fs'
import os from 'os'

import { Config, defaultConfigFile, defaultConfigFileJson, JsonConfig } from '../config'

import { log, tryImport } from '../utils'
import { JsonConfigSchema } from '../config'
import { makeServer } from '..'

const cwd = process.cwd()

export default function install(cliApp: CAC) {
  cliApp
    .command('serve [serveDir]', 'Serve site', { allowUnknownOptions: false })
    .option('--config <file>', 'Config file')
    .option('--port <port>', 'Listening port')
    .option('--route-prefix <routePrefix>', 'Route prefix')
    .option('--verbose', 'Print verbose logging')
    .option('--noAuth', 'Disable basic auth if exists in config file')
    .action((serveDir, options) => {
      if (serveDir) {
        const fullPath = path.resolve(cwd, serveDir)
        if (!fs.existsSync(fullPath)) {
          console.error(`Path to serve not found: ${fullPath}`)
          process.exit(1)
        }

        serveDir = fullPath
      }

      if (options.verbose === true) {
        log.enabled = true
      }

      serveCommand(serveDir, {
        noAuth: options.noAuth,
        configFile: options.config,
        port: options.port,
        routePrefix: options.routePrefix,
      })
    })
}

function getCwdPath(relativePath: string) {
  return path.resolve(cwd, relativePath)
}

function tryImportDefaultConfigFile(): false | { configFile: string; config: Config } {
  for (const configFile of [defaultConfigFileJson, defaultConfigFile]) {
    const configFilePath = getCwdPath(configFile)
    log('Try import config file: %s at path %s', configFile, configFilePath)
    const { exists, error, content: customConfig } = tryImport<Config>(configFilePath)

    if (exists && !error) {
      return { configFile, config: customConfig || {} }
    }
  }

  return false
}
function jsonConfigConvert(data: JsonConfig): Config {
  const config: Config = {}

  if (data.port) {
    config.port = data.port
  }
  if (data.validIps) {
    config.validIps = data.validIps
  }
  if (data.auth) {
    config.auth = data.auth
  }
  if (data.proxies) {
    config.proxies = data.proxies
  }
  if (data.serve) {
    config.serve = data.serve as Config['serve']
  }
  if (data.logs) {
    config.logs = data.logs
  }

  return config
}

function loadConfig(customConfigFile?: string) {
  if (!customConfigFile) return tryImportDefaultConfigFile()

  const configFilePath = path.resolve(cwd, customConfigFile)
  const { exists, error, content: customConfig } = tryImport<Config>(configFilePath)

  if (!exists) {
    const message = `Config file not found: ${customConfigFile}`

    // Throw error if custom config file is not exists
    if (customConfigFile) {
      throw new Error(message)
    }

    console.log(message)
  }
  if (error) {
    console.error('Parse config file failed')
    throw error
  }

  console.log('Use config file:', customConfigFile)

  let useConfig: Config = customConfig || {}

  if (configFilePath.endsWith('.json')) {
    const checkConfig = JsonConfigSchema.safeParse(customConfig)
    if (!checkConfig.success) {
      console.error('Config file is invalid:', checkConfig.error.issues)
      process.exit(1)
    }

    useConfig = jsonConfigConvert(checkConfig.data)
  }

  return { configFile: customConfigFile, config: useConfig }
}

function serveCommand(serveDir: string, options?: { noAuth?: boolean; configFile: string; port?: number | string; routePrefix?: string }) {
  const loadedConfig = loadConfig(options?.configFile)
  const useConfig: Config = loadedConfig ? loadedConfig.config : {}

  log('Loaded config', loadedConfig && loadedConfig.config)
  if (loadedConfig === false) {
    console.log('No config file found, use default config')
  } else {
    console.log('Config file: %s', path.relative(cwd, loadedConfig.configFile || ''))
  }

  const onShutdownCallbacks: Array<() => void> = []

  if (options?.routePrefix) {
    const [linkedDir, disposeCb] = linkRoutePrefix(serveDir, options.routePrefix)
    serveDir = linkedDir
    onShutdownCallbacks.push(disposeCb)
    // console.log('Use link dir', defaultServeDir)
  }

  const serveserveDir = path.resolve(serveDir || useConfig?.serve?.public || cwd)

  console.log('Serve dir:', serveserveDir === cwd ? 'current working dir' : path.relative(cwd, serveserveDir))

  const config: Config = {
    ...useConfig,
    serve: {
      ...(useConfig?.serve || {}),
      ...{ public: serveserveDir },
    },
  }

  log('Use config', config)
  if (options?.noAuth) {
    delete config.auth
    delete config.validIps

    console.warn('Disable basic auth and valid ips')
  }

  const routePrefix = `/${options?.routePrefix || ''}`.replace(/\/{2,}/, '/')
  const customPort = options?.port ? parseInt(String(options.port)) : undefined
  const listeningPort = customPort && !Number.isNaN(customPort) ? customPort : config.port || process.env.PORT || 8080

  const server = makeServer(config).listen(listeningPort, () => {
    console.log(`Listening at: http://localhost:${listeningPort}${routePrefix}`)
  })

  // Do graceful shutdown
  process.on('SIGINT', function () {
    console.log('graceful shutdown app')
    if (server) {
      for (const cb of onShutdownCallbacks) {
        cb()
      }
      server.close(function () {
        console.log('app closed')
      })
    }
  })
}

function linkRoutePrefix(targetPath: string, prefix: string): [string, () => void] {
  const tmpDir = os.tmpdir()
  const targetTempDir = fs.mkdtempSync(`${tmpDir}${path.sep}serve-dir-prefix-`)
  const targetTmpDir = `${targetTempDir}/${prefix}`.replace(/[/\\]{2,}/, path.sep).replace(/[/\\]*$/, '')
  fs.symlinkSync(targetPath, targetTmpDir)

  const disposeCb = () => {
    // console.log('Remove temp linked path:', targetTempDir);
    try {
      fs.rmdirSync(targetTempDir, { recursive: true })
    } catch (e) {
      console.error('Error! Remove temp linked path failed: %s, %s', targetTempDir, e || 'unknown reason')
    }
  }

  return [targetTempDir, disposeCb]
}
