import { api } from './client'

export async function signup(body) {
  return api.request('/auth/signup', { method: 'POST', body: JSON.stringify(body) })
}

export async function login(body) {
  return api.request('/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export async function googleAuth(body) {
  return api.request('/auth/google', { method: 'POST', body: JSON.stringify(body) })
}

export async function forgotPassword(body) {
  return api.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) })
}

export async function changePassword(body) {
  return api.request('/auth/password', { method: 'PATCH', body: JSON.stringify(body) })
}

export async function logout() {
  return api.request('/auth/logout', { method: 'POST' })
}
