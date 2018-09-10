import chokidar from 'chokidar'
import { readFile } from 'fs-extra'
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
      let indexedCount = 0
      league.entries
        .filter(e => !dataIndexFile.existsSummoner(e.playerOrTeamName))
        .forEach((e, i, array) => {
          console.log('Summoner request', e.playerOrTeamId)
          lolapi.getSummonerById(e.playerOrTeamId)
            .then(summoner => {
              if(summoner) {
                dataIndexFile.indexSummonerByName(summoner)
                indexedCount++
                console.log('Indexing', e.playerOrTeamId, `${indexedCount} of ${array.length}`)
              }
            })
        })
    })
}
