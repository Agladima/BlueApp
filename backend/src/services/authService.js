import crypto from 'node:crypto'
import { createState, loadStore, writeStore } from '../db/store.js'

function token() {
  return crypto.randomBytes(18).toString('hex')
}

export function findUserByEmail(email) {
  const store = loadStore()
  return store.users.find((user) => user.email === email)
}

export function createUser({ fullName, email, password, provider = 'password' }) {
  const store = createState()
  const id = crypto.randomUUID()
  const user = { id, fullName, email, password, provider, createdAt: new Date().toISOString() }
  store.users.push(user)
  store.profiles[id] = {
    fullName,
    email,
    avatarUrl: '',
    learningGoal: 'Casual Learning',
    createdAt: user.createdAt,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    selectedContinents: ['Africa'],
    notifPrefs: { weeklyReminder: true },
    onboarded: false,
  }
  store.progress[id] = {}
  store.userAchievements[id] = []
  writeStore(store)
  return user
}

export function issueSession(userId) {
  const store = loadStore()
  const session = { token: token(), userId, createdAt: new Date().toISOString() }
  store.sessions.push(session)
  writeStore(store)
  return session
}

export function resolveSession(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const sessionToken = authHeader.slice(7)
  const store = loadStore()
  const session = store.sessions.find((entry) => entry.token === sessionToken)
  if (!session) return null
  const user = store.users.find((entry) => entry.id === session.userId)
  return user ? { session, user, store } : null
}

export function updateProfile(userId, patch) {
  const store = loadStore()
  store.profiles[userId] = { ...store.profiles[userId], ...patch }
  writeStore(store)
  return store.profiles[userId]
}

export function deleteProfile(userId) {
  const store = loadStore()
  store.users = store.users.filter((user) => user.id !== userId)
  delete store.profiles[userId]
  delete store.progress[userId]
  delete store.userAchievements[userId]
  store.sessions = store.sessions.filter((session) => session.userId !== userId)
  writeStore(store)
}
