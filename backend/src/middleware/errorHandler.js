export function errorHandler(error, res) {
  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: error.message || 'Server error' }))
}
