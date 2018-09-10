import args from '../lib/args'
import { readFileSync } from 'fs'

const basePath = args.basePath ? args.basePath : process.env.HOME + '/.league-find-your-duo/'

export const paths = {
  base: basePath,
  config: basePath + 'config/',
  data: basePath + 'data/',
  static: basePath + 'data/static/',
  indexedChampions: basePath + 'data/static/champions.json',
  indexedSummoners: basePath + 'data/indexed/summoners/',
  indexedMatchesBySummoner: basePath + 'data/indexed/matches/by-summoner/',
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
  ...externalConfig
}
