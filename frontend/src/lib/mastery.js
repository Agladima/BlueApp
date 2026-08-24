import { COUNTRIES } from '../data/countries'
import { CONTINENTS } from '../data/staticMeta'

export function emptyProgress() {
  return { correct: 0, wrong: 0, lastAnswered: null, nextReview: null }
}

export function getProgressRecord(data, id) {
  return data.progress[id] || emptyProgress()
}

export function masteryOf(data, id) {
  const progress = getProgressRecord(data, id)
  const total = progress.correct + progress.wrong
  if (total === 0) return 0
  return Math.round((progress.correct / total) * 100)
}

export function statusOf(data, id) {
  const progress = getProgressRecord(data, id)
  if (progress.correct + progress.wrong === 0) return 'notstarted'
  const mastery = masteryOf(data, id)
  if (mastery >= 80) return 'mastered'
  if (mastery >= 50) return 'improving'
  return 'review'
}

export function countriesOf(continent) {
  return COUNTRIES.filter((country) => country.continent === continent)
}

export function continentMastery(data, continent) {
  const countries = countriesOf(continent)
  if (countries.length === 0) return 0
  const sum = countries.reduce((acc, country) => acc + masteryOf(data, country.id), 0)
  return Math.round(sum / countries.length)
}

export function overallMastery(data) {
  if (COUNTRIES.length === 0) return 0
  const sum = COUNTRIES.reduce((acc, country) => acc + masteryOf(data, country.id), 0)
  return Math.round(sum / COUNTRIES.length)
}

export function masteredCount(data, continent) {
  const countries = continent ? countriesOf(continent) : COUNTRIES
  return countries.filter((country) => statusOf(data, country.id) === 'mastered').length
}

export function countriesLearned(data) {
  return COUNTRIES.filter((country) => {
    const progress = getProgressRecord(data, country.id)
    return progress.correct + progress.wrong > 0
  }).length
}

export function weakCountries(data, limit = 6) {
  return COUNTRIES.filter((country) => {
    const mastery = masteryOf(data, country.id)
    const progress = getProgressRecord(data, country.id)
    return progress.correct + progress.wrong > 0 && mastery < 60
  })
    .sort((a, b) => masteryOf(data, a.id) - masteryOf(data, b.id))
    .slice(0, limit)
}

export function reviewDue(data) {
  const now = new Date()
  return COUNTRIES.filter((country) => {
    const progress = getProgressRecord(data, country.id)
    return progress.nextReview && new Date(progress.nextReview) <= now
  })
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function createDemoProfile() {
  return {
    fullName: 'Demo Learner',
    email: 'demo@blueapp.local',
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
  }
}

export function createDemoState() {
  return {
    profile: createDemoProfile(),
    progress: {},
    quizAttempts: [],
    achievements: [],
    activity: {},
  }
}

export function recordAnswer(data, countryId, correct) {
  const progress = { ...getProgressRecord(data, countryId) }
  if (correct) progress.correct += 1
  else progress.wrong += 1

  progress.lastAnswered = new Date().toISOString()
  const mastery = (progress.correct / (progress.correct + progress.wrong)) * 100
  const nextDays = !correct ? 1 : mastery >= 90 ? 14 : mastery >= 70 ? 7 : 3
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + nextDays)
  progress.nextReview = nextReview.toISOString()

  data.progress[countryId] = progress
  const key = todayKey()
  data.activity[key] = (data.activity[key] || 0) + 1
  return progress
}

export function addXP(data, amount) {
  data.profile.xp += amount
}

export function touchStreak(data, now = new Date()) {
  const today = todayKey(now)
  const last = data.profile.lastActiveDate
  if (last === today) return data.profile.streak
  if (last) {
    const diff = Math.round((new Date(today) - new Date(last)) / 86400000)
    if (diff === 1) data.profile.streak += 1
    else if (diff > 1) data.profile.streak = 1
  } else {
    data.profile.streak = 1
  }
  data.profile.lastActiveDate = today
  data.profile.longestStreak = Math.max(data.profile.longestStreak, data.profile.streak)
  return data.profile.streak
}

export const ACHIEVEMENTS = [
  {
    id: 'africa_explorer',
    icon: '🌍',
    name: 'Africa Explorer',
    desc: 'Master 25 African capitals',
    check: (data) => masteredCount(data, 'Africa') >= 25,
  },
  {
    id: 'continental_master',
    icon: '🏆',
    name: 'Continental Master',
    desc: 'Reach 90% mastery in one continent',
    check: (data) => CONTINENTS.some((continent) => continentMastery(data, continent) >= 90),
  },
  {
    id: 'world_traveler',
    icon: '✈️',
    name: 'World Traveler',
    desc: 'Learn 100 capitals',
    check: (data) => masteredCount(data) >= 100,
  },
  {
    id: 'capital_expert',
    icon: '🧠',
    name: 'Capital Expert',
    desc: 'Reach 95% overall mastery',
    check: (data) => overallMastery(data) >= 95,
  },
  {
    id: 'consistent_learner',
    icon: '🔥',
    name: 'Consistent Learner',
    desc: 'Maintain a 7-day streak',
    check: (data) => data.profile.streak >= 7,
  },
]

export function checkAchievements(data) {
  const newlyUnlocked = []
  ACHIEVEMENTS.forEach((achievement) => {
    if (!data.achievements.includes(achievement.id) && achievement.check(data)) {
      data.achievements.push(achievement.id)
      newlyUnlocked.push(achievement)
    }
  })
  return newlyUnlocked
}

export function buildSeedCountriesSql() {
  return COUNTRIES
    .map(
      (country) =>
        `('${country.id}','${country.name.replaceAll("'", "''")}','${country.capital.replaceAll("'", "''")}','${country.code}','${country.continent.replaceAll("'", "''")}','${country.region.replaceAll("'", "''")}')`,
    )
    .join(',\n')
}
