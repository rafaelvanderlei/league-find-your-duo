import { Client } from 'elasticsearch'

var client = new Client({
  host: 'localhost:9200',
  log: 'info'
})