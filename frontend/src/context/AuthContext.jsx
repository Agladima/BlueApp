import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children, value }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  return useContext(AuthContext)
}

export default AuthContext
