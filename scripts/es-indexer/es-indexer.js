import { readFile, writeFile } from 'fs-extra'
import { Client } from 'elasticsearch'

import args from '../../lib/args'
import dataIndexFile from '../../lib/dataIndexFile';
import config from '../../config/config';

var client = new Client({
  host: 'localhost:9200',
  log: 'info'
})

const indexSummoner = summonerName => {
  return dataIndexFile.getSummonerByName(summonerName)
    .then(summoner => dataIndexFile.getLeaguePositions(summoner.id)
      .then(leaguePositions => {
        const soloDuo = leaguePositions.find(league => league.queueType === 'RANKED_SOLO_5x5')
        const flex = leaguePositions.find(league => league.queueType === 'RANKED_FLEX_SR')

        const indexedSummoner = {
          ...summoner,
          soloDuoLeagueId: soloDuo ? soloDuo.leagueId : null,
          flexLeagueId: flex ? flex.leagueId : null,
          leaguePositions
        }

        client.index({
          index: 'summoners',
          type: 'summoner',
          id: summoner.id,
          body: indexedSummoner
        })

        return indexedSummoner
      })
    )
}

const indexLeague = leagueId => {
  dataIndexFile.getLeagueById(leagueId)
    .then(league => {
      const rankAsInt = { 'V': 5, 'IV': 4, 'III': 3, 'II': 2, 'I': 1 }
      league.entries.forEach(entry => {
        entry.rank = rankAsInt[entry.rank]
      })
      const body = [league]
        .reduce((operations, league) => {
          operations.push({
            index: {
              _index: 'leagues',
              _type: 'league',
              _id: league.leagueId
            }
          })
          operations.push(league)
          return operations
        }, [])
      client.bulk({
        body
      })
    })
}

const indexMasteries = () => {
  dataIndexFile.getMasteriesNotIndexedToElasticsearch()
    .then(listsOfMasteries => {
      dataIndexFile.getChampions()
        .then(champions => {
          const body = listsOfMasteries.reduce((operations, masteries) => {
            masteries.forEach((mastery, index) => {
              operations.push({
                index: {
                  _index: 'masteries',
                  _type: 'mastery',
                  _id: mastery.playerId + ':' + mastery.championId
                }
              })
              operations.push({
                ...mastery,
                championName: champions.data[mastery.championId].name,
                position: index + 1
              })
            })
            return operations
          }, [])
          if(body.length > 0) {
            client.bulk({
              body
            })
          }

          return body.length / 2
        })
        .then(masteriesIndexedCount => {
          console.log('masteriesIndexedCount', masteriesIndexedCount)
          if(masteriesIndexedCount > 0) {
            writeFile(`${config.paths.indexedMasteriesBySummoner}last-indexed-to-elasticsearch`, new Date().toISOString(), 'utf8')
              .catch(err => { if(err)console.log(err) })
          }
        })
    })
}

const indexMatches = summonerId => {
  return dataIndexFile.getChampions()
  .then(champions => {
    return dataIndexFile.getSummonerMatches(summonerId)
      .then(matches => {
        const indexedMatches = {
          summonerId,
          matches: matches.matches
            .filter(match => config.esindexer.matches.queues.includes(match.queue))
            .map(match => ({
              ...match,
              championName: champions.data[match.champion].name
            }))
        }
        client.index({
          index: 'matches',
          type: 'match',
          id: summonerId,
          body: indexedMatches
        })

        return indexedMatches
      })
  })
}

if(args.index === 'summoner') {
  const indexedSummonerP = indexSummoner(args.summonerName)
  if(args.full) {
    indexedSummonerP
      .then(summoner => {
        summoner.soloDuoLeagueId && indexLeague(summoner.soloDuoLeagueId)
        indexMasteries()
      })
  }
} else if(args.index === 'champions') {
  dataIndexFile.getChampions()
    .then(champions => {
      const body = Object.keys(champions.data)
        .reduce((operations, champion) => {
          operations.push({
            index: {
              _index: 'champions',
              _type: 'champion',
              _id: champions.data[champion].id
            }
          })
          operations.push(champions.data[champion])
          return operations
        }, [])
      client.bulk({
        body
      })
    })
    .catch(e => console.log('erro ao obter champions', e))
} else if(args.index === 'leagues') {
  indexLeague(args.leagueId)
} else if(args.index === 'masteries') {
  indexMasteries()
} else if(args.index === 'matches') {
  dataIndexFile.getSummonerByName(args.summonerName)
    .then(summoner => indexMatches(summoner.id))
    .then(indexedMatches => console.log('total indexed matches', indexedMatches.matches.length))
}
