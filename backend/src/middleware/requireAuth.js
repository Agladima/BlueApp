import { ensureProfile, getAuthedUser } from '../db/index.js'

export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return null
  }

  const token = authHeader.slice(7)
  const user = await getAuthedUser(token)
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return null
  }

  req.authToken = token
  req.user = user
  await ensureProfile(user)
  return { user }
}
