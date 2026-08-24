import { addQuizAttempt, getAchievementsIds, getProgressRows, getProfile, patchProfile, setAchievementsIds } from '../db/index.js'
import { checkAchievements } from '../services/achievementService.js'
import { addXP, touchStreak } from '../services/streakService.js'

export async function quizAttemptController(req, res, body) {
  const attempt = {
    id: Date.now(),
    continent: body.continent,
    score: body.score,
    total: body.total,
    percentage: body.percentage,
    completedAt: new Date().toISOString(),
  }
  await addQuizAttempt(req.user.id, attempt)
  const profile = await getProfile(req.user.id)
  addXP(profile, 100)
  touchStreak(profile)
  await patchProfile(req.user.id, profile)
  const progress = await getProgressRows(req.user.id)
  const currentAchievements = await getAchievementsIds(req.user.id)
  const state = { profile, progress, achievements: currentAchievements }
  const newly = checkAchievements(state)
  const nextAchievements = [...new Set([...currentAchievements, ...newly.map((achievement) => achievement.id)])]
  await setAchievementsIds(req.user.id, nextAchievements)
  res.end(JSON.stringify({ attempt, newlyUnlocked: newly }))
}
