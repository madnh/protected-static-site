import { CAC } from 'cac'
import path from 'path'
import * as fs from 'fs'
import { defaultConfigFile, defaultConfigFileJson } from '../config'

export default function install(cac: CAC) {
  cac.command('init-config', 'Init config file', { allowUnknownOptions: false }).action(() => initConfigCommand())
}

async function copyStubFile(stubFile: string, targetFile: string) {
  const stubFilePath = path.resolve(__dirname, `../../stubs/${stubFile}`)

  return fs.promises.copyFile(stubFilePath, targetFile)
}

async function initConfigCommand() {
  await copyStubFile('sample.js', defaultConfigFile)
  await copyStubFile('sample.json', defaultConfigFileJson)

  console.log('Done')
}
