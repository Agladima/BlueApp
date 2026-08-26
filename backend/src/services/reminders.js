import { env } from '../config/env.js'
import { loadStore } from '../db/store.js'
import { isSupabaseEnabled } from '../db/index.js'

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function daysSince(dateValue) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const diff = new Date(dayKey()) - new Date(dateValue)
  return Math.floor(diff / 86400000)
}

function reminderDue(profile) {
  if (!profile) return false
  const weeklyOn = profile.notifPrefs?.weeklyReminder ?? profile.notif_weekly_reminder ?? true
  if (!weeklyOn) return false
  const lastActive = profile.lastActiveDate || profile.last_active_date || null
  return daysSince(lastActive) >= 6
}

async function supabaseRequest(path, { method = 'GET', body, token = env.supabaseSecretKey, apikey = env.supabaseSecretKey, headers = {} } = {}) {
  const requestHeaders = {
    apikey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${env.supabaseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Supabase request failed (${response.status})`)
  }
  return payload
}

async function getProfiles() {
  if (!isSupabaseEnabled()) {
    const store = loadStore()
    return Object.values(store.profiles || {}).map((profile) => ({
      ...profile,
      notifPrefs: profile.notifPrefs || { weeklyReminder: true },
    }))
  }

  const rows = await supabaseRequest('/rest/v1/profiles?select=id,email,full_name,notif_weekly_reminder,last_active_date,activity')
  return (rows || []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    notifPrefs: { weeklyReminder: row.notif_weekly_reminder ?? true },
    lastActiveDate: row.last_active_date || null,
    activity: row.activity || {},
  }))
}

async function sendEmail({ to, subject, html, text }) {
  if (!env.resendApiKey || !env.reminderFromEmail) {
    return { skipped: true, reason: 'Email provider not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${env.appName} <${env.reminderFromEmail}>`,
      to,
      subject,
      html,
      text,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Email send failed')
  }
  return payload
}

export async function sendWeeklyReminders() {
  const profiles = await getProfiles()
  const due = profiles.filter(reminderDue)
  const results = []

  for (const profile of due) {
    const firstName = (profile.fullName || profile.email || 'BlueApp learner').split(' ')[0]
    const target = `${env.frontendUrl || 'https://blueapp.onrender.com'}/weekly`
    const subject = `${env.appName}: your weekly geography practice is ready`
    const text = `Hi ${firstName}, your BlueApp weekly test is ready. Open ${target} to keep going.`
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin:0 0 12px;">Your weekly BlueApp test is ready</h2>
        <p>Hi ${firstName},</p>
        <p>Your weekly geography test is ready. Open BlueApp to keep your streak going and review your progress.</p>
        <p><a href="${target}">Open BlueApp</a></p>
      </div>
    `

    try {
      const sent = await sendEmail({ to: profile.email, subject, html, text })
      results.push({ email: profile.email, sent: !sent?.skipped, skipped: Boolean(sent?.skipped), reason: sent?.reason || null })
    } catch (error) {
      results.push({ email: profile.email, sent: false, error: error.message || 'Failed to send' })
    }
  }

  return {
    checked: profiles.length,
    due: due.length,
    results,
  }
}
