import { api } from './client'

export function getCountries() {
  return api.request('/countries')
}
