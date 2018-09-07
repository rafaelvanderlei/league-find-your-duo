import { readFile, existsSync as _existsSync } from 'fs-extra'

const summonerName = 'IamSoulReaper'

const lolindexapi = {
  basePath: 'src',
  get: path => readFile('data' + path + '.json', 'utf8').then(file => JSON.parse(file)),
  existsSync: path => _existsSync('data' + path + '.json')
}

const championsP = lolindexapi.get('/static/champions').catch(e => console.log('erro ao obter champions', e))
const summonerP = lolindexapi.get('/indexed/summoners/' + summonerName).catch(e => console.log('erro ao obter summoner.', e))
const leaguePositionsP = summonerP.then(summoner => lolindexapi.get('/indexed/leagues/positions/' + summoner.id)).catch(e => console.log('erro ao obter positions.', e))
const soloDuoLeagueP = leaguePositionsP.then(leagues => {
  const soloDuo = leagues.find(league => league.queueType === 'RANKED_SOLO_5x5')
  if(soloDuo) {
    return lolindexapi.get('/indexed/leagues/by-id/' + soloDuo.leagueId)
  } else {
    return null
  }
}).catch(e => console.log('erro ao obter soloduo.', e))
const soloDuoSummonersMasteriesP = soloDuoLeagueP.then(league => league
  .entries
  .filter(e => lolindexapi.existsSync('/indexed/champion-masteries/by-summoner/' + e.playerOrTeamId))
  .map(e => lolindexapi.get('/indexed/champion-masteries/by-summoner/' + e.playerOrTeamId).catch(e => console.log('erro ao obter mastety para summoner ' + e.playerOrTeamId, e)))
).catch(e => console.log('erro ao obter lista de masteries', e))

Promise.all([championsP, summonerP, leaguePositionsP, soloDuoLeagueP, soloDuoSummonersMasteriesP])
  .then(values => {
    const champions = values[0]
    const summoner = values[1]
    const leaguePositions = values[2]
    const soloDuoLeague = values[3]
    const masteriesP = values[4]

    Promise.all(masteriesP)
      .then(masteries => {
        searchForDuos(champions, summoner, leaguePositions, soloDuoLeague, masteries)
      })
      .catch(e => console.log('erro ao obter as masteries', e))
  })

const searchForDuos = (champions, summoner, leaguePositions, soloDuoLeague, masteries) => {
  const bestSummoners = soloDuoLeague.entries
    .filter(e => !e.inactive)
    .filter(e => e.wins > 10 + e.losses)
    .filter(e => e.leaguePoints > 50)
    .filter(e => toRank(e.rank).atLeast(2))
    // .filter(e => {
    //   const summonerMasteries = masteries.find(m => m[0].playerId === Number(e.playerOrTeamId))
    //     .filter(m => m.championPoints > 100000)
    //   return summonerMasteries.length > 0
    // })

  console.log(bestSummoners.length)
  bestSummoners.forEach(s => {
    // const summonerMasteries = masteries
    //   .find(m => m[0].playerId === Number(s.playerOrTeamId))
    //   .slice(0, 3)
    //   .map(m => ({ ...m, championName: champions.data[m.championId].name }))
    // console.log(s, summonerMasteries)
    // console.log(s)
  })
}

const toRank = r => {
  const rankAsInt = { 'V': 5, 'IV': 4, 'III': 3, 'II': 2, 'I': 1 }[r]
  return {
    rank: rankAsInt,
    atLeast: cr => rankAsInt <= cr
  }
}
