import { readFile } from 'fs-extra'
import { Client } from 'elasticsearch'
import bodybuilder from 'bodybuilder'

// const leagueId = 'a873cbc0-9073-11e8-b334-d4ae5289a399'
// const leagueId = '99e4ea70-fc7c-11e7-a6b5-d4ae5289a399'

var client = new Client({
  host: 'localhost:9200',
  log: 'info'
})

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

const championsFilter = champs.support
// const championsFilter = adcChampions

readFile('scripts/analyzer/es-analyzer-query.json')
  .then(file => JSON.parse(file))
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
        masteries
          .filter(mastery => mastery.masteries.length > 0)
          .forEach(mastery => console.log(mastery.playerOrTeamName + '[' + mastery.playerOrTeamId + ']', mastery.masteries.map(m => m.championName + '[' + m.position + ']')))
      })
  })
