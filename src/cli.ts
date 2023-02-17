#!/usr/bin/env node
import cac from 'cac'

import initConfigCommand from './cli-commands/init-config'
import serveSubCommand from './cli-commands/serve'
const pkg = require('../package.json')

const cli = cac(pkg.name)
cli.version(pkg.version)
cli.help()

// Default command
cli.command('').action(() => cli.outputHelp())

initConfigCommand(cli)
serveSubCommand(cli)

cli.parse()
