import { deleteUser, ensureProfile, getAchievementsIds, getProfile, patchProfile } from '../db/index.js'

export async function profileGetController(req, res) {
  await ensureProfile(req.user)
  const profile = await getProfile(req.user.id)
  const achievements = await getAchievementsIds(req.user.id)
  res.end(JSON.stringify({ profile, achievements }))
}

export async function profilePatchController(req, res, body) {
  const updated = await patchProfile(req.user.id, body.profile || body)
  res.end(JSON.stringify({ profile: updated }))
}

export async function profileDeleteController(req, res) {
  await deleteUser(req.user.id)
  res.end(JSON.stringify({ ok: true }))
}
