import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COUNTRIES } from '../../../frontend/src/data/countries.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const storePath = join(__dirname, '../../db/dev-store.json')

function seed() {
  return {
    users: [],
    sessions: [],
    countries: COUNTRIES,
    profiles: {},
    progress: {},
    quizAttempts: [],
    achievements: [],
    userAchievements: {},
  }
}

export function loadStore() {
  if (!existsSync(storePath)) {
    mkdirSync(dirname(storePath), { recursive: true })
    const initial = seed()
    writeStore(initial)
    return initial
  }
  try {
    return JSON.parse(readFileSync(storePath, 'utf8'))
  } catch {
    const initial = seed()
    writeStore(initial)
    return initial
  }
}

export function writeStore(store) {
  mkdirSync(dirname(storePath), { recursive: true })
  writeFileSync(storePath, JSON.stringify(store, null, 2))
}

export function createState() {
  return loadStore()
}
