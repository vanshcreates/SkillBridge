import { useContext } from 'react'
import { AuthDialogContext } from '../context/auth-dialog-context'

export const useAuthDialog = () => {
  const context = useContext(AuthDialogContext)
  if (!context) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider.')
  }
  return context
}
