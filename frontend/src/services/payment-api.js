import { apiRequest } from './auth-api'

/**
 * Fetch Razorpay public Key ID
 */
export async function getRazorpayConfigApi() {
  return await apiRequest('/payment/config', {
    method: 'GET',
  })
}

/**
 * Create a trusted payment order on the backend (calculates amounts from DB)
 * @param {Object} orderData - { items, shippingAddress, note, existingOrderId }
 */
export async function createPaymentOrderApi(orderData) {
  return await apiRequest('/payment/create-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

/**
 * Verify Razorpay payment signature on the backend
 * @param {Object} paymentData - { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyPaymentApi(paymentData) {
  return await apiRequest('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  })
}

/**
 * Record payment failure or cancellation on the backend
 * @param {Object} failureData - { orderId, razorpay_order_id, error }
 */
export async function reportPaymentFailureApi(failureData) {
  return await apiRequest('/payment/failed', {
    method: 'POST',
    body: JSON.stringify(failureData),
  })
}

