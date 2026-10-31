import { useEffect } from 'react'

/**
 * Custom hook to prevent browser back-button navigation out of authenticated dashboards.
 * Traps popstate events to keep the user firmly on their dashboard until they log out.
 *
 * @param {boolean} [enabled=true] - Whether back button trapping is active
 */
export function usePreventBack(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    // Push state so there's always an active entry in history to prevent exiting
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // Re-push current URL to cancel the browser back navigation
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled])
}

