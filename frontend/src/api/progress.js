import { api } from './client'

export function getProgress() {
  return api.request('/progress')
}

export function submitAnswer(body) {
  return api.request('/progress/answer', { method: 'POST', body: JSON.stringify(body) })
}

export function updateProfile(body) {
  return api.request('/profile', { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteProfile() {
  return api.request('/profile', { method: 'DELETE' })
}
