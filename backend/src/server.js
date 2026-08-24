import http from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { ensureSeedData } from './db/index.js'
import { logger } from './utils/logger.js'

const app = createApp()
const server = http.createServer(app)

await ensureSeedData()

server.listen(env.port, () => {
  logger(`BlueApp backend listening on http://localhost:${env.port}`)
})
