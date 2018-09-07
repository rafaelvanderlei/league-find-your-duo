import { writeFile, existsSync } from 'fs-extra'
import config from '../config/config'

export const indexSummonerByName = summoner => {
  const fileName = `${config.paths.indexedSummoners}${summoner.name}.json`
  return _index(fileName, summoner)
}

export const indexLeagueById = league => {
  const fileName = `${config.paths.indexedLeaguesById}${league.leagueId}.json`
  return _index(fileName, league)
}

export const indexLeaguePositions = (summonerId, leaguePositions) => {
  const fileName = `${config.paths.indexedLeaguesPositions}${summonerId}.json`
  return _index(fileName, leaguePositions)
}

export const indexMasteriesBySummoner = (summonerId, masteries) => {
  const fileName = `${config.paths.indexedMasteriesBySummoner}${summonerId}.json`
  return _index(fileName, masteries)
}

export const existsMasteriesBySummoner = summonerId => existsSync(`${config.paths.indexedMasteriesBySummoner}${summonerId}.json`)

const _index = (fileName, document) => {
  return writeFile(fileName, JSON.stringify(document), 'utf8')
    .catch(err => {
      if(err) {
        console.log(err)
      }
    })
}

export default {
  indexSummonerByName,
  indexLeagueById,
  indexLeaguePositions,
  indexMasteriesBySummoner,
  existsMasteriesBySummoner
}
