import { api } from './client'

export function createQuizAttempt(body) {
  return api.request('/quiz-attempts', { method: 'POST', body: JSON.stringify(body) })
}
