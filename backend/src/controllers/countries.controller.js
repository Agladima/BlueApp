import { getCountries } from '../db/index.js'

export async function countriesController(req, res) {
  const countries = await getCountries()
  res.end(JSON.stringify({ countries }))
}
