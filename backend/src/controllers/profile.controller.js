import { deleteUser, ensureProfile, getAchievementsIds, getProfile, patchProfile } from '../db/index.js'

export async function profileGetController(req, res) {
  try {
    await ensureProfile(req.user)
    const profile = await getProfile(req.user.id)
    const achievements = await getAchievementsIds(req.user.id)
    res.end(JSON.stringify({ profile, achievements }))
  } catch {
    res.end(JSON.stringify({
      profile: null,
      achievements: [],
    }))
  }
}

export async function profilePatchController(req, res, body) {
  try {
    const updated = await patchProfile(req.user.id, body.profile || body)
    res.end(JSON.stringify({ profile: updated }))
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Unable to update profile' }))
  }
}

export async function profileDeleteController(req, res) {
  await deleteUser(req.user.id)
  res.end(JSON.stringify({ ok: true }))
}
