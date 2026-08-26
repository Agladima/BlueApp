export function findUserByEmail(email) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}

export function createUser({ fullName, email, password, provider = 'password' }) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}

export function issueSession(userId) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}

export function resolveSession(authHeader) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}

export function updateProfile(userId, patch) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}

export function deleteProfile(userId) {
  throw new Error('Local auth is disabled. Use Supabase auth instead.')
}
