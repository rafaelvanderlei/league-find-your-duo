import args from '../lib/args'
import { readFileSync } from 'fs'

const basePath = args.basePath ? args.basePath : process.env.HOME + '/.league-find-your-duo/'

export const paths = {
  base: basePath,
  config: basePath + 'config/',
  data: basePath + 'data/',
  static: basePath + 'data/static/',
  indexedSummoners: basePath + 'data/indexed/summoners/',
  indexedMasteriesBySummoner: basePath + 'data/indexed/champions-masteries/by-summoner/',
  indexedLeaguesById: basePath + 'data/indexed/leagues/by-id/',
  indexedLeaguesPositions: basePath + 'data/indexed/leagues/positions/'
}

const externalConfig = (() => {
  try {
    return JSON.parse(readFileSync(`${paths.config}config.json`, 'utf8'))
  } catch (err) {
    return { state: 'UNLOADED' }
  }
})()

export default {
  paths,
  lolapi: externalConfig.lolapi
}
