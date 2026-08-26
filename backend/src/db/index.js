import crypto from 'node:crypto'
import { COUNTRIES } from '../../../frontend/src/data/countries.js'
import { env } from '../config/env.js'
import { ACHIEVEMENTS as ACHIEVEMENT_DEFS } from '../services/achievementService.js'
import { loadStore, writeStore } from './store.js'

const useSupabase = Boolean(env.supabaseUrl && env.supabaseSecretKey)

function authHeaders({ apikey = env.supabaseSecretKey, token = env.supabaseSecretKey } = {}) {
  return {
    apikey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

async function supabaseRequest(path, { method = 'GET', token = env.supabaseSecretKey, apikey = env.supabaseSecretKey, body, headers = {} } = {}) {
  const response = await fetch(`${env.supabaseUrl}${path}`, {
    method,
    headers: { ...authHeaders({ apikey, token }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      `Supabase request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

function demoProfile(fullName, email) {
  return {
    fullName,
    email,
    avatarUrl: '',
    learningGoal: 'Casual Learning',
    createdAt: new Date().toISOString(),
    xp: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    selectedContinents: ['Africa'],
    notifPrefs: { weeklyReminder: true },
    onboarded: false,
    activity: {},
  }
}

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url || '',
    learningGoal: row.learning_goal || '',
    createdAt: row.created_at,
    xp: row.xp || 0,
    streak: row.streak || 0,
    longestStreak: row.longest_streak || 0,
    lastActiveDate: row.last_active_date || null,
    selectedContinents: row.selected_continents || [],
    notifPrefs: { weeklyReminder: row.notif_weekly_reminder ?? true },
    onboarded: row.onboarded ?? false,
    activity: row.activity || {},
  }
}

function localUserByEmail(email) {
  const store = loadStore()
  return store.users.find((user) => user.email === email) || null
}

function localUserById(userId) {
  const store = loadStore()
  return store.users.find((user) => user.id === userId) || null
}

async function ensureRemoteProfile(user) {
  const existing = await supabaseRequest(`/rest/v1/profiles?id=eq.${user.id}&select=*`, { token: env.supabaseSecretKey, apikey: env.supabaseSecretKey })
  if (existing?.length) return existing[0]

  const profile = demoProfile(user.user_metadata?.full_name || user.full_name || user.email.split('@')[0], user.email)
  profile.created_at = profile.createdAt
  profile.full_name = profile.fullName
  profile.avatar_url = profile.avatarUrl
  profile.learning_goal = profile.learningGoal
  profile.longest_streak = profile.longestStreak
  profile.last_active_date = profile.lastActiveDate
  profile.selected_continents = profile.selectedContinents
  profile.notif_weekly_reminder = profile.notifPrefs.weeklyReminder
  profile.onboarded = profile.onboarded
  profile.activity = {}
  await supabaseRequest('/rest/v1/profiles', {
    method: 'POST',
    token: env.supabaseSecretKey,
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: {
      id: user.id,
      full_name: profile.fullName,
      email: profile.email,
      avatar_url: profile.avatarUrl,
      learning_goal: profile.learningGoal,
      created_at: profile.createdAt,
      xp: profile.xp,
      streak: profile.streak,
      longest_streak: profile.longestStreak,
      last_active_date: profile.lastActiveDate,
      selected_continents: profile.selectedContinents,
      notif_weekly_reminder: profile.notifPrefs.weeklyReminder,
      onboarded: profile.onboarded,
      activity: profile.activity,
    },
  })
  return profile
}

function localEnsureProfile(user) {
  const store = loadStore()
  if (!store.profiles[user.id]) {
    store.profiles[user.id] = demoProfile(user.fullName, user.email)
    store.progress[user.id] = store.progress[user.id] || {}
    store.userAchievements[user.id] = store.userAchievements[user.id] || []
    writeStore(store)
  }
  return store.profiles[user.id]
}

export function isSupabaseEnabled() {
  return useSupabase
}

export async function getCountries() {
  if (!useSupabase) return loadStore().countries || COUNTRIES
  return supabaseRequest('/rest/v1/countries?select=*&order=continent.asc,region.asc,name.asc')
}

export async function ensureSeedData() {
  if (!useSupabase) return

  const countries = await getCountries()
  if (!countries?.length) {
    await supabaseRequest('/rest/v1/countries', {
      method: 'POST',
      token: env.supabaseSecretKey,
      apikey: env.supabaseSecretKey,
      headers: { Prefer: 'return=representation' },
      body: COUNTRIES,
    })
  }

  const achievements = await supabaseRequest('/rest/v1/achievements?select=id', {
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
  })
  if (!achievements?.length) {
    await supabaseRequest('/rest/v1/achievements', {
      method: 'POST',
      token: env.supabaseSecretKey,
      apikey: env.supabaseSecretKey,
      headers: { Prefer: 'return=representation' },
      body: ACHIEVEMENT_DEFS.map((achievement) => ({
        id: achievement.id,
        icon: achievement.icon,
        name: achievement.name,
        description: achievement.desc,
      })),
    })
  }
}

export async function signUpWithPassword({ fullName, email, password }) {
  if (!useSupabase) {
    const store = loadStore()
    const existing = store.users.find((user) => user.email === email)
    if (existing) throw new Error('Account already exists')
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    store.users.push({ id, fullName, email, password, provider: 'password', createdAt })
    store.profiles[id] = demoProfile(fullName, email)
    store.profiles[id].createdAt = createdAt
    store.progress[id] = {}
    store.userAchievements[id] = []
    writeStore(store)
    return { user: { id, email, user_metadata: { full_name: fullName } }, session: { access_token: `demo-${id}` } }
  }

  const payload = await supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    body: {
      email,
      password,
      options: { data: { full_name: fullName } },
    },
  })
  if (payload?.user) await ensureRemoteProfile(payload.user)
  return payload
}

export async function signInWithPassword({ email, password, fullName = 'BlueApp User' }) {
  if (!useSupabase) {
    const store = loadStore()
    let user = store.users.find((entry) => entry.email === email)
    if (!user || user.password !== password) throw new Error('Invalid email or password')
    return { user, session: { access_token: `demo-${user.id}` } }
  }

  const payload = await supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    body: { email, password },
  })
  if (payload?.user) await ensureRemoteProfile(payload.user)
  return payload
}

export function buildGoogleAuthUrl() {
  if (!useSupabase) {
    return null
  }
  const redirectTo = env.frontendUrl || 'http://localhost:5173'
  const redirect = encodeURIComponent(redirectTo)
  return `${env.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirect}`
}

export async function recoverPassword(email) {
  if (!useSupabase) return { ok: true }
  return supabaseRequest('/auth/v1/recover', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    body: { email, gotrue_meta_security: {} },
  })
}

export async function getAuthedUser(token) {
  if (!useSupabase) {
    const store = loadStore()
    const sessionToken = token?.startsWith('demo-') ? token.slice(5) : null
    const user = sessionToken ? localUserById(sessionToken) : null
    if (!user) return null
    return { id: user.id, email: user.email, user_metadata: { full_name: user.fullName } }
  }

  const user = await supabaseRequest('/auth/v1/user', {
    token,
    apikey: env.supabaseSecretKey,
    headers: {},
  })
  if (user) await ensureRemoteProfile(user)
  return user
}

export async function getProfile(userId) {
  if (!useSupabase) {
    const store = loadStore()
    return store.profiles[userId] || null
  }
  const rows = await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}&select=*`)
  return mapProfileRow(rows?.[0] || null)
}

export async function ensureProfile(user) {
  if (!useSupabase) return localEnsureProfile({ id: user.id, fullName: user.user_metadata?.full_name || user.email.split('@')[0], email: user.email })
  return ensureRemoteProfile(user)
}

export async function patchProfile(userId, patch) {
  if (!useSupabase) {
    const store = loadStore()
    store.profiles[userId] = { ...store.profiles[userId], ...patch }
    writeStore(store)
    return store.profiles[userId]
  }

  const current = await getProfile(userId)
  if (!current) throw new Error('Profile not found')
  const next = {
    ...current,
    ...patch,
  }

  await supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    headers: { Prefer: 'return=representation' },
    body: {
      full_name: next.fullName ?? next.full_name,
      email: next.email,
      avatar_url: next.avatarUrl ?? next.avatar_url ?? '',
      learning_goal: next.learningGoal ?? next.learning_goal ?? '',
      xp: next.xp ?? 0,
      streak: next.streak ?? 0,
      longest_streak: next.longestStreak ?? next.longest_streak ?? 0,
      last_active_date: next.lastActiveDate ?? next.last_active_date ?? null,
      selected_continents: next.selectedContinents ?? next.selected_continents ?? [],
      notif_weekly_reminder: next.notifPrefs?.weeklyReminder ?? next.notif_weekly_reminder ?? true,
      onboarded: next.onboarded ?? false,
      activity: next.activity ?? {},
    },
  })

  return mapProfileRow({
    id: userId,
    full_name: next.fullName ?? next.full_name,
    email: next.email,
    avatar_url: next.avatarUrl ?? next.avatar_url ?? '',
    learning_goal: next.learningGoal ?? next.learning_goal ?? '',
    created_at: next.createdAt ?? next.created_at,
    xp: next.xp ?? 0,
    streak: next.streak ?? 0,
    longest_streak: next.longestStreak ?? next.longest_streak ?? 0,
    last_active_date: next.lastActiveDate ?? next.last_active_date ?? null,
    selected_continents: next.selectedContinents ?? next.selected_continents ?? [],
    notif_weekly_reminder: next.notifPrefs?.weeklyReminder ?? next.notif_weekly_reminder ?? true,
    onboarded: next.onboarded ?? false,
    activity: next.activity ?? {},
  })
}

export async function deleteUser(userId) {
  if (!useSupabase) {
    const store = loadStore()
    store.users = store.users.filter((user) => user.id !== userId)
    delete store.profiles[userId]
    delete store.progress[userId]
    delete store.userAchievements[userId]
    store.sessions = store.sessions.filter((session) => session.userId !== userId)
    writeStore(store)
    return
  }

  await Promise.all([
    supabaseRequest(`/rest/v1/user_progress?user_id=eq.${userId}`, { method: 'DELETE', token: env.supabaseSecretKey, apikey: env.supabaseSecretKey }),
    supabaseRequest(`/rest/v1/quiz_attempts?user_id=eq.${userId}`, { method: 'DELETE', token: env.supabaseSecretKey, apikey: env.supabaseSecretKey }),
    supabaseRequest(`/rest/v1/user_achievements?user_id=eq.${userId}`, { method: 'DELETE', token: env.supabaseSecretKey, apikey: env.supabaseSecretKey }),
    supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, { method: 'DELETE', token: env.supabaseSecretKey, apikey: env.supabaseSecretKey }),
    supabaseRequest(`/auth/v1/admin/users/${userId}`, { method: 'DELETE', token: env.supabaseSecretKey, apikey: env.supabaseSecretKey }),
  ])
}

export async function getProgressRows(userId) {
  if (!useSupabase) {
    const store = loadStore()
    return store.progress[userId] || {}
  }
  const rows = await supabaseRequest(`/rest/v1/user_progress?user_id=eq.${userId}&select=*`, { apikey: env.supabaseSecretKey, token: env.supabaseSecretKey })
  const map = {}
  for (const row of rows || []) {
    map[row.country_id] = {
      correct: row.correct || 0,
      wrong: row.wrong || 0,
      lastAnswered: row.last_answered || null,
      nextReview: row.next_review || null,
    }
  }
  return map
}

export async function saveProgressRow(userId, countryId, progress) {
  if (!useSupabase) {
    const store = loadStore()
    store.progress[userId] ||= {}
    store.progress[userId][countryId] = progress
    writeStore(store)
    return progress
  }

  await supabaseRequest('/rest/v1/user_progress', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: {
      user_id: userId,
      country_id: countryId,
      correct: progress.correct,
      wrong: progress.wrong,
      last_answered: progress.lastAnswered,
      next_review: progress.nextReview,
    },
  })
  return progress
}

export async function getQuizAttempts(userId) {
  if (!useSupabase) {
    const store = loadStore()
    return store.quizAttempts.filter((attempt) => attempt.userId === userId)
  }
  const rows = await supabaseRequest(`/rest/v1/quiz_attempts?user_id=eq.${userId}&select=*&order=completed_at.desc`, { apikey: env.supabaseSecretKey, token: env.supabaseSecretKey })
  return (rows || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    continent: row.continent,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    completedAt: row.completed_at,
  }))
}

export async function addQuizAttempt(userId, attempt) {
  if (!useSupabase) {
    const store = loadStore()
    store.quizAttempts.push({ ...attempt, userId })
    writeStore(store)
    return attempt
  }

  const rows = await supabaseRequest('/rest/v1/quiz_attempts', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    headers: { Prefer: 'return=representation' },
    body: {
      user_id: userId,
      continent: attempt.continent,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      completed_at: attempt.completedAt || new Date().toISOString(),
    },
  })
  return rows?.[0] || attempt
}

export async function getAchievementsIds(userId) {
  if (!useSupabase) {
    const store = loadStore()
    return store.userAchievements[userId] || []
  }
  const rows = await supabaseRequest(`/rest/v1/user_achievements?user_id=eq.${userId}&select=achievement_id`, { apikey: env.supabaseSecretKey, token: env.supabaseSecretKey })
  return (rows || []).map((row) => row.achievement_id)
}

export async function setAchievementsIds(userId, ids) {
  if (!useSupabase) {
    const store = loadStore()
    store.userAchievements[userId] = ids
    writeStore(store)
    return ids
  }
  if (!ids.length) return []
  await supabaseRequest('/rest/v1/user_achievements', {
    method: 'POST',
    token: env.supabaseSecretKey,
    apikey: env.supabaseSecretKey,
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: ids.map((achievementId) => ({
      user_id: userId,
      achievement_id: achievementId,
    })),
  })
  return ids
}

export async function incrementActivity(userId, dateKey) {
  if (!useSupabase) {
    const store = loadStore()
    store.profiles[userId] ||= demoProfile('BlueApp User', 'demo@blueapp.local')
    store.profiles[userId].activity ||= {}
    store.profiles[userId].activity[dateKey] = (store.profiles[userId].activity[dateKey] || 0) + 1
    writeStore(store)
    return store.profiles[userId].activity
  }

  const profile = await getProfile(userId)
  const activity = { ...(profile?.activity || {}) }
  activity[dateKey] = (activity[dateKey] || 0) + 1
  await patchProfile(userId, { ...profile, activity })
  return activity
}
