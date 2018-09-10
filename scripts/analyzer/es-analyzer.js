import { readFile } from 'fs-extra'
import { Client } from 'elasticsearch'
import bodybuilder from 'bodybuilder'
import parseTemplate from 'json-templates'
import args from '../../lib/args'
import clipboardy from 'clipboardy'

var client = new Client({
  host: 'localhost:9200',
  log: 'info'
})

const searchSummonerByName = summonerName => {
  const builder = bodybuilder()
    .query('term', 'name.keyword', summonerName)
  
  const body = builder.build()
  return client.search({
    index: 'summoners',
    body
  })
    .then(result => result.hits.hits[0]._source)
}

const searchMasteries = criteria => {
  const builder = bodybuilder()
    .sort('championPoints', 'desc')
    .query('term', 'playerId', criteria.playerId)

  if(criteria.championName) {
    builder.query('match', 'championName', criteria.championName.join(' '))
  }

  if(criteria.championPosition) {
    builder.query('terms', 'position', criteria.championPosition)
  }

  const body = builder.build()

  return client.search({
    index: 'masteries',
    body
  })
    .then(result => result.hits.hits)
}

const champs = {
  support: ['Morgana', 'Nami', 'Lux', 'Lulu', 'Karma', 'Thresh', 'Blitzcrank', 'Pyke', 'Janna', 'Sona', 'Rakan', 'Alistar', 'Tahm Kench', 'Braum', 'Leona', 'Taric', 'Shen'],
  adc: ['Jhin', 'Kai\'Sa', 'Ezreal', 'Lucian', 'Jinx', 'Draven', 'Miss Fortune', 'Twitch', 'Sivir', 'Varus', 'Tristana', 'Caitlyn', 'Xayah', 'Vayne', 'Ashe', 'Kalista']
}

// const championsFilter = champs.support
const championsFilter = champs.adc

readFile('scripts/analyzer/es-analyzer-query.json')
  .then(file => JSON.parse(file))
  .then(query => {
    return searchSummonerByName(args.summonerName)
      .then(summoner => {
        const queryTemplate = parseTemplate(query)
        return queryTemplate({
          leagueId: summoner.soloDuoLeagueId
        })
      })
  })
  .then(query => {
    return client.search({
      index: 'leagues',
      body: query
    })
      .then(result => result.hits.hits[0].inner_hits.entries.hits.hits.map(summoner => summoner._source))
      .then(summoners => summoners.map(summoner => searchMasteries({ playerId: summoner.playerOrTeamId, championPosition: [1, 2, 3], championName: championsFilter })
        .then(masteries => masteries.map(mastery => mastery._source))
        .then(masteries => ({ ...summoner, masteries }))
      ))
  })
  .then(masteriesP => {
    Promise.all(masteriesP)
      .then(masteries => {
        console.log('masteries', masteries.length)
        masteries
        // .filter(mastery => mastery.masteries.length > 0)
        .forEach(mastery => console.log(mastery.playerOrTeamName + '[' + mastery.playerOrTeamId + ']', mastery.masteries.map(m => m.championName + '[' + m.position + ']')))
        return masteries
      })
      .then(masteries => {
        const summoners = masteries
          .filter(mastery => mastery.masteries.length > 0)
          .map(m => m.playerOrTeamName)
          .join(',')
        console.log(summoners)
        clipboardy.writeSync(summoners)
      })
  })
