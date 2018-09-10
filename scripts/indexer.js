import dataIndexerFile from '../lib/dataIndexFile'
import lolapi from '../lib/lolapi'
import args from '../lib/args'

// const summonerName = 'IamSoulReaper'
// const summonerName = 'Kyo Rx Impact'
// const summonerName = 'Niru'
// const summonerName = 'incrivelhook'
// const summonerName = 'templario'
const summonerName = args.summonerName

const summonerP = lolapi.getSummonerByName(summonerName)
const matchesP = summonerP.then(summoner => lolapi.getSummonerMatches(summoner.accountId))
const leaguePositionsP = summonerP.then(summoner => lolapi.getLeaguesPositionsBySummonerId(summoner.id))
const soloDuoLeagueP = leaguePositionsP.then(leagues => {
  const soloDuo = leagues.find(league => league.queueType === 'RANKED_SOLO_5x5')
  if(soloDuo) {
    return lolapi.getLeagueById(soloDuo.leagueId)
  } else {
    return null
  }
})

// if(!args.skipMasteries) {
//   soloDuoLeagueP.then(league => {
//     league.entries
//       .filter(e => !dataIndexerFile.existsMasteriesBySummoner(e.playerOrTeamId))
//       .forEach(e => {
//         console.log(new Date(), 'masteries request', e.playerOrTeamId)
//         lolapi.getMasteries(e.playerOrTeamId)
//           .then(masteries => {
//             console.log(new Date(), 'masteries result', e.playerOrTeamId, masteries && masteries.length)
//             dataIndexerFile.indexMasteriesBySummoner(e.playerOrTeamId, masteries || [])
//           })
//       })
//   })
// }

Promise.all([summonerP, leaguePositionsP, soloDuoLeagueP, matchesP])
  .then(values => {
    const summoner = values[0]
    const leaguePositions = values[1]
    const soloDuoLeague = values[2]
    const matches = values[3]

    dataIndexerFile.indexSummonerByName(summoner)
    dataIndexerFile.indexSummonerMatches(summoner.id, matches)
    dataIndexerFile.indexLeagueById(soloDuoLeague)
    dataIndexerFile.indexLeaguePositions(summoner.id, leaguePositions)
  })
