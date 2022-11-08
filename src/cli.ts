#!/usr/bin/env node
import cac from 'cac'
import path from 'path'
import { Config, makeServer } from './index'
import { log, tryImport } from './utils'
import { Server } from 'http'
import * as fs from 'fs'

const pkg = require('../package.json')
const defaultConfigFile = 'serve-di.config.js'

const cli = cac(pkg.name)
cli.version(pkg.version)
cli.help()

// Default command
cli.command('').action(() => cli.outputHelp())

cli.command('serve', 'Serve site', { allowUnknownOptions: false })
  .option('--config <file>', 'Config file')
  .option('--port <port>', 'Listening port')
  .option('--route-prefix <routePrefix>', 'Route prefix')
  .action((options) => {
    serveCommand({
      configFile: options.file,
      port: options.port,
      routePrefix: options.routePrefix
    })
  })
cli.command('init', 'Init config file', { allowUnknownOptions: false })
  .option('--config <file>', 'Config file')
  .action((options) => initCommand({ configFile: options.file }))

cli.parse()

function serveCommand(options?: { configFile: string, port?: number | string, routePrefix?: string }) {
  const configFileName = options?.configFile
  const configFilePath = path.resolve(process.cwd(), configFileName || defaultConfigFile)
  const { exists, content: customConfig } = tryImport<Config>(configFilePath)

  if (!exists) {
    const message = `Config file not found: ${configFileName || defaultConfigFile}`

    // Throw error if custom config file is not exists
    if (configFileName) {
      throw new Error(message)
    }

    console.log(message)
  }

  log('Config file: %s', path.relative(process.cwd(), configFilePath))

  let server: Server
  const config: Config = {
    ...customConfig,
    serveHandler: {
      ...(customConfig?.serveHandler || {})
    },
    routePrefix: options?.routePrefix || customConfig?.routePrefix || ''
  }
  const routePrefix = `/${config.routePrefix || ''}`.replace(/\/{2,}/, '/')
  const customPort = options?.port ? parseInt(String(options.port)) : undefined
  const listeningPort = (customPort && !Number.isNaN(customPort)) ? customPort : (config.port || process.env.PORT || 8080)

  server = makeServer(config).listen(listeningPort, () => {
    console.log(`Listening at: http://localhost:${listeningPort}${routePrefix}`)
  })

// Do graceful shutdown
  process.on('SIGINT', function() {
    console.log('graceful shutdown app')
    if (server) {
      server.close(function() {
        console.log('app closed')
      })
    }
  })
}

function initCommand(options?: { configFile?: string }) {
  const configFileName = options?.configFile || defaultConfigFile
  const configFilePath = path.resolve(process.cwd(), configFileName)
  const stubFile = path.resolve(__dirname, '../stubs/sample.js')
  const configTemplate = fs.readFileSync(stubFile).toString()

  console.log(`Config file: ${configFileName}`)

  fs.writeFileSync(configFilePath, configTemplate)
  console.log('Done')
}
