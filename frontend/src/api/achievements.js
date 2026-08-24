import { api } from './client'

export function getAchievements() {
  return api.request('/achievements')
}
