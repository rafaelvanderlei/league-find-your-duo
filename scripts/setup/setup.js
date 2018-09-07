import config from '../../config/config'
import mkdirp from 'mkdirp'
import { existsSync, copyFileSync } from 'fs'

console.log('starting setup')

const createIfNotExists = path => {
  if(!existsSync(path)) {
    mkdirp.sync(path)
    console.log(`created ${path}`)
  } else {
    console.log(`${path} was already setup`)
  }
}

for (let path in config.paths) {
  createIfNotExists(config.paths[path])
}

const configFileName = `${config.paths.config}config.json`
if(!existsSync(configFileName)) {
  console.log(`created ${configFileName}`)
  copyFileSync('scripts/setup/config.json', configFileName)
} else {
  console.log(`${configFileName} was already setup`)
}

console.log('setup finished')
