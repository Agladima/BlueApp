import { useUserDataContext } from '../context/UserDataContext'

export function useUserData() {
  return useUserDataContext()
}
