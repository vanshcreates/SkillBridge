import { apiRequest } from './auth-api'

// ─────────────────────────────────────────────
// MARKETPLACE — Public product browsing (no auth needed)
// ─────────────────────────────────────────────

/**
 * Fetch published marketplace products (public — no auth required)
 */
export async function getMarketplaceProductsApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/marketplace/products${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Fetch single product details by ID or slug (public — no auth required)
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
 * Fetch customer's own order history via marketplace route (Customer only)
 */
export async function getCustomerOrdersMarketplaceApi() {
  return await apiRequest('/marketplace/orders', {
    method: 'GET',
  })
}

// ─────────────────────────────────────────────
// CUSTOMER — Dashboard
// ─────────────────────────────────────────────

/**
 * Get customer dashboard stats (orders, spending, wishlist count)
 */
export async function getCustomerDashboardApi() {
  return await apiRequest('/customer/dashboard', { method: 'GET' })
}

// ─────────────────────────────────────────────
// CUSTOMER — Profile
// ─────────────────────────────────────────────

/**
 * Get customer profile with stats
 */
export async function getCustomerProfileApi() {
  return await apiRequest('/customer/profile', { method: 'GET' })
}

/**
 * Update customer profile (name, phone, bio, city, state)
 */
export async function updateCustomerProfileApi(profileData) {
  return await apiRequest('/customer/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

/**
 * Upload customer avatar photo (accepts File object or base64 string)
 */
export async function uploadCustomerAvatarApi(fileOrBase64) {
  if (typeof fileOrBase64 === 'string') {
    // base64 string path
    return await apiRequest('/customer/profile/photo', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: fileOrBase64 }),
    })
  }
  // File object — send as multipart
  const formData = new FormData()
  formData.append('avatar', fileOrBase64)
  const BASE_URL =
    import.meta.env?.VITE_API_URL ||
    'http://localhost:8000/api'
  const token = localStorage.getItem('skillbridge-auth-token')
  const response = await fetch(`${BASE_URL}/customer/profile/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  return response.json()
}

/**
 * Remove customer avatar photo
 */
export async function removeCustomerAvatarApi() {
  return await apiRequest('/customer/profile/photo', { method: 'DELETE' })
}

// ─────────────────────────────────────────────
// CUSTOMER — Orders
// ─────────────────────────────────────────────

/**
 * Get customer orders with optional status filter and pagination
 * @param {Object} params - { status, page, limit }
 */
export async function getCustomerOrdersApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/customer/orders${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Get a single customer order by ID or order number
 */
export async function getCustomerOrderByIdApi(id) {
  return await apiRequest(`/customer/orders/${id}`, { method: 'GET' })
}

/**
 * Cancel a customer order (only works if status is Awaiting response or Processing)
 */
export async function cancelCustomerOrderApi(id) {
  return await apiRequest(`/customer/orders/${id}/cancel`, { method: 'PATCH' })
}

// ─────────────────────────────────────────────
// CUSTOMER — Wishlist
// ─────────────────────────────────────────────

/**
 * Get customer wishlist
 */
export async function getCustomerWishlistApi() {
  return await apiRequest('/customer/wishlist', { method: 'GET' })
}

/**
 * Add a product to wishlist
 */
export async function addToWishlistApi(productId) {
  return await apiRequest('/customer/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
}

/**
 * Remove a product from wishlist
 */
export async function removeFromWishlistApi(productId) {
  return await apiRequest(`/customer/wishlist/${productId}`, { method: 'DELETE' })
}

/**
 * Check if a product is in the customer's wishlist
 */
export async function checkWishlistStatusApi(productId) {
  return await apiRequest(`/customer/wishlist/check/${productId}`, { method: 'GET' })
}

// ─────────────────────────────────────────────
// CUSTOMER — Addresses
// ─────────────────────────────────────────────

/**
 * Get customer saved addresses
 */
export async function getCustomerAddressesApi() {
  return await apiRequest('/customer/addresses', { method: 'GET' })
}

/**
 * Add a new address
 * @param {Object} addressData - { label, fullName, phone, email, address, city, state, postalCode, isDefault }
 */
export async function addCustomerAddressApi(addressData) {
  return await apiRequest('/customer/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  })
}

/**
 * Update an existing address by ID
 */
export async function updateCustomerAddressApi(addressId, addressData) {
  return await apiRequest(`/customer/addresses/${addressId}`, {
    method: 'PATCH',
    body: JSON.stringify(addressData),
  })
}

/**
 * Delete an address by ID
 */
export async function deleteCustomerAddressApi(addressId) {
  return await apiRequest(`/customer/addresses/${addressId}`, { method: 'DELETE' })
}

/**
 * Set an address as the default shipping address
 */
export async function setDefaultAddressApi(addressId) {
  return await apiRequest(`/customer/addresses/${addressId}/default`, { method: 'PATCH' })
}
