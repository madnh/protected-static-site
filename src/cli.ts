#!/usr/bin/env node
import cac from 'cac'
import path from 'path'
import { Config, makeServer } from './index'
import { log, tryImport } from './utils'
import * as fs from 'fs'

const pkg = require('../package.json')
const defaultConfigFile = 'serve-di.config.js'
const cwd = process.cwd()

const cli = cac(pkg.name)
cli.version(pkg.version)
cli.help()

// Default command
cli.command('').action(() => cli.outputHelp())

cli
  .command('serve [publicDir]', 'Serve site', { allowUnknownOptions: false })
  .option('--config <file>', 'Config file')
  .option('--port <port>', 'Listening port')
  .option('--route-prefix <routePrefix>', 'Route prefix')
  .option('--verbose', 'Print verbose logging')
  .action((publicDir, options) => {
    let defaultServeDir = cwd

    if (publicDir) {
      console.log('Serve director:', path.relative(cwd, publicDir) || path.relative(publicDir, cwd) || './')
      const fullPath = path.resolve(cwd, publicDir)
      if (!fs.existsSync(fullPath)) {
        console.error(`publicDir not found: ${fullPath}`)
        process.exit(1)
      }

      defaultServeDir = fullPath
    }

    if (options.verbose === true) {
      log.enabled = true
    }

    serveCommand({
      defaultServeDir,
      configFile: options.file,
      port: options.port,
      routePrefix: options.routePrefix,
    })
  })

cli.command('init-config [file]', 'Init config file', { allowUnknownOptions: false }).action((file) => initConfigCommand({ configFile: file }))

cli
  .command('init-package [div]', 'Init package.json file')
  .option('name <name>', 'Name of package', { default: 'app' })
  .action((dir, options) => initPackageCommand(dir, options))

cli.parse()

function serveCommand(options?: { defaultServeDir?: string; configFile: string; port?: number | string; routePrefix?: string }) {
  const configFileName = options?.configFile
  const configFilePath = path.resolve(process.cwd(), configFileName || defaultConfigFile)
  const { exists, error, content: customConfig } = tryImport<Config>(configFilePath)

  if (!exists) {
    const message = `Config file not found: ${configFileName || defaultConfigFile}`

    // Throw error if custom config file is not exists
    if (configFileName) {
      throw new Error(message)
    }

    console.log(message)
  }
  if (error) {
    console.error('Parse config file failed')
    throw error
  }

  log('Config file: %s', path.relative(process.cwd(), configFilePath))

  const config: Config = {
    ...customConfig,
    serveHandler: {
      ...(options?.defaultServeDir ? { public: options.defaultServeDir } : {}),
      ...(customConfig?.serveHandler || {}),
    },
    routePrefix: options?.routePrefix || customConfig?.routePrefix || '',
  }
  const routePrefix = `/${config.routePrefix || ''}`.replace(/\/{2,}/, '/')
  const customPort = options?.port ? parseInt(String(options.port)) : undefined
  const listeningPort = customPort && !Number.isNaN(customPort) ? customPort : config.port || process.env.PORT || 8080

  const server = makeServer(config).listen(listeningPort, () => {
    console.log(`Listening at: http://localhost:${listeningPort}${routePrefix}`)
  })

  // Do graceful shutdown
  process.on('SIGINT', function () {
    console.log('graceful shutdown app')
    if (server) {
      server.close(function () {
        console.log('app closed')
      })
    }
  })
}

function initConfigCommand(options?: { configFile?: string }) {
  const configFileName = options?.configFile || defaultConfigFile
  const configFilePath = path.resolve(process.cwd(), configFileName)
  const stubFile = path.resolve(__dirname, '../stubs/sample.js')
  const configTemplate = fs.readFileSync(stubFile).toString()

  console.log(`Config file: ${configFileName}`)

  fs.writeFileSync(configFilePath, configTemplate)
  console.log('Done')
}

function initPackageCommand(dir = '.', { name } = { name: 'app' }) {
  const outputFile = path.resolve(process.cwd(), dir, 'package.json')
  const template = JSON.stringify(
    {
      name,
      private: true,
      scripts: {
        start: 'serve-di serve',
      },
      dependencies: {
        'serve-di': `^${pkg.version}`,
      },
    },
    null,
    2
  )

  console.log('Write file:', outputFile)
  fs.writeFileSync(outputFile, template)
  console.log('Done')
}
