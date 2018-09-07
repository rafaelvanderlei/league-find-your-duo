import { readFile, readdir, readFileSync, stat, writeFile } from 'fs-extra'
import { Client } from 'elasticsearch'

import args from '../../lib/args'

var client = new Client({
  host: 'localhost:9200',
  log: 'info'
})

if(args.index === 'champions') {
  readFile('data/static/champions.json', 'utf8')
    .then(file => JSON.parse(file))
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
  console.log(args.leagueId)
  readFile('data/indexed/leagues/by-id/' + args.leagueId + '.json', 'utf8')
    .then(file => JSON.parse(file))
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
    .catch(e => console.log('erro ao obter leagues', e))
} else if(args.index === 'masteries') {
  const lastIndexationTime = new Date(readFileSync('data/indexed/champion-masteries/by-summoner/last-indexed-to-elasticsearch', 'utf8'))

  readdir('data/indexed/champion-masteries/by-summoner/')
    .then(files => Promise.all(files
      .filter(file => file.endsWith('.json'))
      .map(file => stat('data/indexed/champion-masteries/by-summoner/' + file)
        .then(fileStat => {
          if(fileStat.mtime > lastIndexationTime) {
            return readFile('data/indexed/champion-masteries/by-summoner/' + file, 'utf8')
              .then(file => JSON.parse(file))
              .then(masteries => masteries.slice(0, 10))
          } else {
            return []
          }
        })
      ))
      .then(listsOfMasteries => {
        readFile('data/static/champions.json', 'utf8')
          .then(file => JSON.parse(file))
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
              writeFile('data/indexed/champion-masteries/by-summoner/last-indexed-to-elasticsearch', new Date(), 'utf8', err => { if(err)console.log(err) })
            }
          })
      })
    )
    .catch(e => console.log('erro ao obter masteries', e))
}
