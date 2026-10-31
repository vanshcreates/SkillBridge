import { apiRequest } from './auth-api'

/**
 * Fetch published marketplace products (Customer only)
 */
export async function getMarketplaceProductsApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/marketplace/products${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Fetch single product details by ID or slug (Customer only)
 */
export async function getMarketplaceProductByIdApi(id) {
  return await apiRequest(`/marketplace/products/${id}`, {
    method: 'GET',
  })
}

/**
 * Place a customer order in marketplace (Customer only)
 */
export async function createMarketplaceOrderApi(orderData) {
  return await apiRequest('/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

/**
 * Fetch customer's own order history (Customer only)
 */
export async function getCustomerOrdersApi() {
  return await apiRequest('/marketplace/orders', {
    method: 'GET',
  })
}

