import { ACHIEVEMENTS } from '../services/achievementService.js'
import { loadStore } from '../db/store.js'

export async function achievementsController(req, res) {
  const store = loadStore()
  res.end(JSON.stringify({
    achievements: ACHIEVEMENTS,
    unlocked: store.userAchievements[req.user.id] || [],
  }))
}
