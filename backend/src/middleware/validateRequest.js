export function validateRequest(body, fields) {
  for (const field of fields) {
    if (!body?.[field]) {
      const error = new Error(`Missing required field: ${field}`)
      error.status = 400
      throw error
    }
  }
}
