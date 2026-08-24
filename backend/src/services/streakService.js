export function touchStreak(profile, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const last = profile.lastActiveDate
  if (last === today) return profile.streak
  if (last) {
    const diff = Math.round((new Date(today) - new Date(last)) / 86400000)
    if (diff === 1) profile.streak += 1
    else if (diff > 1) profile.streak = 1
  } else {
    profile.streak = 1
  }
  profile.lastActiveDate = today
  profile.longestStreak = Math.max(profile.longestStreak || 0, profile.streak)
  return profile.streak
}

export function addXP(profile, amount) {
  profile.xp = (profile.xp || 0) + amount
  return profile.xp
}
