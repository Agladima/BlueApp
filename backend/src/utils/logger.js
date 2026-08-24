export function logger(...args) {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[blueapp]', ...args)
  }
}
