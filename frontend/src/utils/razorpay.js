/**
 * Dynamically load the official Razorpay Checkout SDK script
 * @returns {Promise<boolean>}
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // If already loaded on window, resolve immediately
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }

    // Check if script element is already injected
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      existingScript.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK.')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

