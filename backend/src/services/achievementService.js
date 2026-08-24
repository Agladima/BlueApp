import { continentMastery, masteredCount, overallMastery } from './masteryService.js'

const ACHIEVEMENTS = [
  { id: 'africa_explorer', icon: '🌍', name: 'Africa Explorer', desc: 'Master 25 African capitals', check: (state) => masteredCount(state.progress, 'Africa') >= 25 },
  { id: 'continental_master', icon: '🏆', name: 'Continental Master', desc: 'Reach 90% mastery in one continent', check: (state) => ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].some((continent) => continentMastery(state.progress, continent) >= 90) },
  { id: 'world_traveler', icon: '✈️', name: 'World Traveler', desc: 'Learn 100 capitals', check: (state) => masteredCount(state.progress) >= 100 },
  { id: 'capital_expert', icon: '🧠', name: 'Capital Expert', desc: 'Reach 95% overall mastery', check: (state) => overallMastery(state.progress) >= 95 },
  { id: 'consistent_learner', icon: '🔥', name: 'Consistent Learner', desc: 'Maintain a 7-day streak', check: (state) => (state.profile.streak || 0) >= 7 },
]

export function checkAchievements(state) {
  const newly = []
  for (const achievement of ACHIEVEMENTS) {
    if (!state.achievements.includes(achievement.id) && achievement.check(state)) {
      state.achievements.push(achievement.id)
      newly.push(achievement)
    }
  }
  return newly
}

export { ACHIEVEMENTS }
