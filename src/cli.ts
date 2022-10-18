#!/usr/bin/env node

import {Config, makeServer} from "./index";
import {log, tryImport} from "./utils"
import path from "path";

const configFile = path.resolve(process.cwd(), 'protected-site')
const {exists, content: customConfig} = tryImport<Config>(configFile);

log('Config file: %s', configFile)
if (!exists) {
  console.log('No custom config found: protected-site.js')
}

const config: Config = {
  ...customConfig,
  serveHandler: {
    ...(customConfig?.serveHandler || {}),
  },
}

const server = makeServer(config)
const listeningPort = config.port || process.env.PORT || 8080;
server.listen(listeningPort, () => console.log(`Server is listening on port ${listeningPort}`));
