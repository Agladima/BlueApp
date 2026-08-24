import { COUNTRIES } from '../../../frontend/src/data/countries.js'

export function emptyProgress() {
  return { correct: 0, wrong: 0, lastAnswered: null, nextReview: null }
}

export function masteryOf(progress) {
  const total = progress.correct + progress.wrong
  if (total === 0) return 0
  return Math.round((progress.correct / total) * 100)
}

export function statusOf(progress) {
  if (progress.correct + progress.wrong === 0) return 'notstarted'
  const mastery = masteryOf(progress)
  if (mastery >= 80) return 'mastered'
  if (mastery >= 50) return 'improving'
  return 'review'
}

export function continentMastery(progressMap, continent) {
  const countries = COUNTRIES.filter((country) => country.continent === continent)
  if (!countries.length) return 0
  const sum = countries.reduce((acc, country) => acc + masteryOf(progressMap[country.id] || emptyProgress()), 0)
  return Math.round(sum / countries.length)
}

export function overallMastery(progressMap) {
  if (!COUNTRIES.length) return 0
  const sum = COUNTRIES.reduce((acc, country) => acc + masteryOf(progressMap[country.id] || emptyProgress()), 0)
  return Math.round(sum / COUNTRIES.length)
}

export function masteredCount(progressMap, continent) {
  const countries = continent ? COUNTRIES.filter((country) => country.continent === continent) : COUNTRIES
  return countries.filter((country) => statusOf(progressMap[country.id] || emptyProgress()) === 'mastered').length
}

export function countriesLearned(progressMap) {
  return COUNTRIES.filter((country) => {
    const progress = progressMap[country.id] || emptyProgress()
    return progress.correct + progress.wrong > 0
  }).length
}

export function weakCountries(progressMap, limit = 6) {
  return COUNTRIES.filter((country) => {
    const progress = progressMap[country.id] || emptyProgress()
    return progress.correct + progress.wrong > 0 && masteryOf(progress) < 60
  })
    .sort((a, b) => masteryOf(progressMap[a.id] || emptyProgress()) - masteryOf(progressMap[b.id] || emptyProgress()))
    .slice(0, limit)
}

export function reviewDue(progressMap, now = new Date()) {
  return COUNTRIES.filter((country) => {
    const progress = progressMap[country.id] || emptyProgress()
    return progress.nextReview && new Date(progress.nextReview) <= now
  })
}

export function recordAnswer(progressMap, countryId, correct, now = new Date()) {
  const progress = { ...(progressMap[countryId] || emptyProgress()) }
  if (correct) progress.correct += 1
  else progress.wrong += 1
  progress.lastAnswered = now.toISOString()
  const mastery = (progress.correct / (progress.correct + progress.wrong)) * 100
  const nextDays = !correct ? 1 : mastery >= 90 ? 14 : mastery >= 70 ? 7 : 3
  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + nextDays)
  progress.nextReview = nextReview.toISOString()
  progressMap[countryId] = progress
  return progress
}
