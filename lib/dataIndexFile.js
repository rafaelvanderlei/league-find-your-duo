import { writeFile, existsSync, readFile, readdir, statSync } from 'fs-extra'
import moment from 'moment'
import config from '../config/config'

export const indexSummonerByName = summoner => {
  const fileName = `${config.paths.indexedSummoners}${summoner.name}.json`
  return _index(fileName, summoner)
}

export const indexSummonerMatches = (summonerId, matches) => {
  const fileName = `${config.paths.indexedMatchesBySummoner}${summonerId}.json`
  return _index(fileName, matches)
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

export const existsSummoner = summonerName => existsSync(`${config.paths.indexedSummoners}${summonerName}.json`)

const _index = (fileName, document) => {
  return writeFile(fileName, JSON.stringify(document), 'utf8')
    .catch(err => {
      if(err) {
        console.log(err)
      }
    })
}

export const getSummonerByName = summonerName => {
  const fileName = `${config.paths.indexedSummoners}${summonerName}.json`
  return readFile(fileName, 'utf8')
    .then(file => JSON.parse(file))
    .catch(e => console.log(`Error trying to get summoner ${summonerName}`, e))
}

export const getSummonerMatches = summonerId => {
  const fileName = `${config.paths.indexedMatchesBySummoner}${summonerId}.json`
  return readFile(fileName, 'utf8')
    .then(file => JSON.parse(file))
    .catch(e => console.log(`Error trying to get matches for summoner ${summonerId}`, e))
}

export const existsSummonerMatches = (summonerId, { lastModifiedAfter }) => {
  const fileName = `${config.paths.indexedMatchesBySummoner}${summonerId}.json`
  return existsSync(fileName) && moment(statSync(fileName).mtime).isAfter(lastModifiedAfter)
}

export const getLeagueById = leagueId => {
  const fileName = `${config.paths.indexedLeaguesById}${leagueId}.json`
  return readFile(fileName, 'utf8')
    .then(file => JSON.parse(file))
    .catch(e => console.log(`Error trying to get league ${leagueId}`, e))
}

export const getLeaguePositions = summonerId => {
  const fileName = `${config.paths.indexedLeaguesPositions}${summonerId}.json`
  return readFile(fileName)
    .then(file => JSON.parse(file))
    .catch(e => console.log(`Error trying to get summoner ${summonerId}`, e))
}

export const getMasteriesNotIndexedToElasticsearch = (maxMasteriesPerSummoner = 10) => {
  return readFile(`${config.paths.indexedMasteriesBySummoner}last-indexed-to-elasticsearch`, 'utf8')
    .then(lastIndexationTime => new Date(lastIndexationTime))
    .then(lastIndexationTime => readdir(config.paths.indexedMasteriesBySummoner)
      .then(files => Promise.all(files
        .filter(file => file.endsWith('.json'))
        .filter(file => statSync(`${config.paths.indexedMasteriesBySummoner}${file}`).mtime > lastIndexationTime)
        .map(file => readFile(`${config.paths.indexedMasteriesBySummoner}${file}`, 'utf8')
          .then(file => JSON.parse(file))
          .then(masteries => masteries.slice(0, maxMasteriesPerSummoner))
        )
      ))
    )
}

export const getChampions = () => {
  return readFile(config.paths.indexedChampions, 'utf8')
    .then(file => JSON.parse(file))
}

export default {
  indexSummonerByName,
  indexSummonerMatches,
  indexLeagueById,
  indexLeaguePositions,
  indexMasteriesBySummoner,
  existsMasteriesBySummoner,
  existsSummoner,
  getSummonerByName,
  getSummonerMatches,
  existsSummonerMatches,
  getChampions,
  getLeagueById,
  getLeaguePositions,
  getMasteriesNotIndexedToElasticsearch
}
