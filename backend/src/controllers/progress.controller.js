import { getAchievementsIds, getProfile, getProgressRows, getQuizAttempts, incrementActivity, patchProfile, saveProgressRow, setAchievementsIds } from '../db/index.js'
import { checkAchievements } from '../services/achievementService.js'
import { addXP } from '../services/streakService.js'
import { recordAnswer } from '../services/masteryService.js'
import { touchStreak } from '../services/streakService.js'

export async function progressGetController(req, res) {
  try {
    const progress = await getProgressRows(req.user.id)
    const profile = await getProfile(req.user.id)
    const quizAttempts = await getQuizAttempts(req.user.id)
    const activity = profile?.activity || {}
    res.end(JSON.stringify({
      progress,
      quizAttempts,
      activity,
    }))
  } catch {
    res.end(JSON.stringify({
      progress: {},
      quizAttempts: [],
      activity: {},
    }))
  }
}

export async function answerController(req, res, body) {
  try {
    const progressMap = await getProgressRows(req.user.id)
    const progress = recordAnswer(progressMap, body.countryId, body.correct)
    await saveProgressRow(req.user.id, body.countryId, progress)
    const today = new Date().toISOString().slice(0, 10)
    await incrementActivity(req.user.id, today)
    const profile = await getProfile(req.user.id)
    addXP(profile, body.correct ? 10 : 2)
    touchStreak(profile)
    const currentAchievements = await getAchievementsIds(req.user.id)
    const state = { profile, progress: progressMap, achievements: currentAchievements }
    const newly = checkAchievements(state)
    const nextAchievements = [...new Set([...currentAchievements, ...newly.map((achievement) => achievement.id)])]
    await setAchievementsIds(req.user.id, nextAchievements)
    await patchProfile(req.user.id, profile)
    res.end(JSON.stringify({ progress, profile, achievements: nextAchievements, newlyUnlocked: newly }))
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Unable to save progress' }))
  }
}
