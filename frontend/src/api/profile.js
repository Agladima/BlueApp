import { api } from './client'

export function getProfile() {
  return api.request('/profile')
}

export function updateProfile(body) {
  return api.request('/profile', { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteProfile() {
  return api.request('/profile', { method: 'DELETE' })
}
