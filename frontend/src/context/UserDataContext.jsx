import { createContext, useContext } from 'react'

const UserDataContext = createContext(null)

export function UserDataProvider({ children, value }) {
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
}

export function useUserDataContext() {
  return useContext(UserDataContext)
}

export default UserDataContext
