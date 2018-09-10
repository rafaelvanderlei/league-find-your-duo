import chokidar from 'chokidar'
import { readFile } from 'fs-extra'
import moment from 'moment'
import config from '../../config/config'
import dataIndexFile from '../../lib/dataIndexFile'
import lolapi from '../../lib/lolapi'

const watcher = chokidar.watch(config.paths.indexedLeaguesById, {
  ignoreInitial: true
})

watcher.on('add', path => {
  console.log('file added', path)
  handleFile(path)
})

watcher.on('change', path => {
  console.log('file changed', path)
  handleFile(path)
})

const handleFile = path => {
  readFile(path)
    .then(file => JSON.parse(file))
    .then(league => {
      console.log(`Starting to index matches for summoners in league ${league.leagueId}`)
      let indexedCount = 0
      league.entries
        .filter(e => dataIndexFile.existsSummoner(e.playerOrTeamName))
        .filter(e => !dataIndexFile.existsSummonerMatches(e.playerOrTeamId, { lastModifiedAfter: moment().subtract(1, 'hours') }))
        .forEach((e, i, array) => {
          dataIndexFile.getSummonerByName(e.playerOrTeamName)
            .then(summoner => {
              console.log(new Date(), 'matches request', summoner.id, summoner.accountId)
              lolapi.getSummonerMatches(summoner.accountId)
                .then(matches => {
                  if(matches) {
                    dataIndexFile.indexSummonerMatches(summoner.id, matches)
                    indexedCount++
                    console.log(new Date(), 'indexing', summoner.id, summoner.accountId, matches && matches.matches.length, `${indexedCount} of ${array.length}`)
                  }
                })
            })
        })
    })
}
