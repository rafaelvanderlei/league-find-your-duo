import rp from 'request-promise'
import { createLimiterAsync } from '../lib/rateLimiterAsync'
import config from '../config/config'

const stdCatch = msg => e => console.log(msg, e)

let currentApiKeyIndex = 0
let currentApiKeyRequestsCount = 0

const getApiKey = () => {
  if(config.lolapi.keys.length === 1) {
    return config.lolapi.keys[0]
  }

  if(currentApiKeyRequestsCount < config.lolapi.requestsPerKey) {
    currentApiKeyRequestsCount++
  } else {
    if(currentApiKeyIndex < (config.lolapi.keys.length - 1)) {
      currentApiKeyIndex++
    } else {
      currentApiKeyIndex = 0
    }
    currentApiKeyRequestsCount = 1
  }
  return config.lolapi.keys[currentApiKeyIndex]
}

const get = url => {
  return rp({
    'uri': config.lolapi.baseUrl + url,
    'headers': { 'X-Riot-Token': getApiKey() },
    ...config.lolapi.requestAdditionalOptions
  }).then(response => JSON.parse(response))
    .catch(err => console.log('erro no get', err.statusCode))
}

const limiterAsync = createLimiterAsync(config.lolapi.throttling.requests, config.lolapi.throttling.every)

const getWithThrottling = url => {
  return limiterAsync.removeTokensAsync(1).then(() => get(url))
}

export const getMasteries = summonerId => {
  return getWithThrottling(`/champion-mastery/v3/champion-masteries/by-summoner/${summonerId}`)
    .catch(stdCatch(`error trying to get masteries for summoner  ${summonerId}.`))
}

export const getSummonerByName = summonerName => {
  return get(`/summoner/v3/summoners/by-name/${summonerName}`)
    .catch(stdCatch(`error trying to get summoner ${summonerName}.`))
}

export const getLeaguesPositionsBySummonerId = summonerId => {
  return get(`/league/v3/positions/by-summoner/${summonerId}`)
    .catch(stdCatch(`error trying to get leagues positions for summoner ${summonerId}.`))
}

export const getLeagueById = leagueId => {
  return get(`/league/v3/leagues/${leagueId}`)
    .catch(stdCatch(`error trying to get league ${leagueId}`))
}

export default {
  getMasteries,
  getSummonerByName,
  getLeaguesPositionsBySummonerId,
  getLeagueById
}
