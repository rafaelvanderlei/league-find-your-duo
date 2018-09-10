import chokidar from 'chokidar'
import config from '../../config/config'

const watcher = chokidar.watch(config.paths.indexedLeaguesById)

const indexMatches = matches => {
  console.log(matches)
}

watcher.on('add', path => {
  console.log('file added', path);
})

watcher.on('change', path => {
  console.log('file changed', path);
})
