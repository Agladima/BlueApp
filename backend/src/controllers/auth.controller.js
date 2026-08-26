import { buildGoogleAuthUrl, deleteUser, recoverPassword, signInWithPassword, signUpWithPassword, updatePassword } from '../db/index.js'

export async function signupController(req, res, body) {
  const { fullName, email, password } = body
  try {
    const payload = await signUpWithPassword({ fullName, email, password })
    const token = payload?.session?.access_token || payload?.session?.token || payload?.access_token || ''
    res.end(JSON.stringify({ token, userId: payload?.user?.id || payload?.user?.user_id || null }))
  } catch (error) {
    res.writeHead(409, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Account already exists' }))
  }
}

export async function loginController(req, res, body) {
  const { email, password } = body
  try {
    const payload = await signInWithPassword({ email, password, fullName: body.fullName })
    const token = payload?.session?.access_token || payload?.session?.token || payload?.access_token || ''
    res.end(JSON.stringify({ token, userId: payload?.user?.id || payload?.user?.user_id || null }))
  } catch (error) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Invalid login' }))
  }
}

export async function googleController(req, res) {
  const authUrl = buildGoogleAuthUrl()
  if (!authUrl) {
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.end(JSON.stringify({ authUrl }))
}

export async function forgotController(req, res, body) {
  try {
    await recoverPassword(body.email)
  } catch {
    // Keep the UX resilient; password recovery errors shouldn't block the app flow.
  }
  res.end(JSON.stringify({ ok: true }))
}

export async function passwordController(req, res, body) {
  try {
    await updatePassword(req.user.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      authToken: req.authToken,
    })
    res.end(JSON.stringify({ ok: true }))
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Unable to update password' }))
  }
}

export async function logoutController(req, res) {
  res.end(JSON.stringify({ ok: true }))
}

export async function deleteAccountController(req, res) {
  await deleteUser(req.user.id)
  res.end(JSON.stringify({ ok: true }))
}
