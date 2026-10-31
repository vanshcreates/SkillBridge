import { apiRequest } from './auth-api'

/**
 * Fetch dashboard metrics, shop status, recent orders, and recent listings for artisan
 */
export async function getArtisanDashboardApi() {
  return await apiRequest('/artisan/dashboard', { method: 'GET' })
}

/**
 * Fetch current artisan's shop details
 */
export async function getArtisanShopApi() {
  return await apiRequest('/artisan/shop', { method: 'GET' })
}

/**
 * Create or update artisan shop
 */
export async function saveArtisanShopApi(shopData) {
  return await apiRequest('/artisan/shop', {
    method: 'POST',
    body: JSON.stringify(shopData),
  })
}

/**
 * Fetch all products/listings created by current artisan
 */
export async function getArtisanListingsApi() {
  return await apiRequest('/artisan/products', { method: 'GET' })
}

/**
 * Create a new product listing (saved as Draft)
 */
export async function createArtisanListingApi(listingData) {
  return await apiRequest('/artisan/products', {
    method: 'POST',
    body: JSON.stringify(listingData),
  })
}

/**
 * Publish product listing to the customer marketplace
 */
export async function publishArtisanListingApi(listingId) {
  return await apiRequest(`/artisan/products/${listingId}/publish`, {
    method: 'PATCH',
  })
}

/**
 * Unpublish product listing (revert to Draft)
 */
export async function unpublishArtisanListingApi(listingId) {
  return await apiRequest(`/artisan/products/${listingId}/unpublish`, {
    method: 'PATCH',
  })
}

/**
 * Delete a product listing
 */
export async function deleteArtisanListingApi(listingId) {
  return await apiRequest(`/artisan/products/${listingId}`, {
    method: 'DELETE',
  })
}

/**
 * Fetch all customer/industry orders assigned to this artisan
 */
export async function getArtisanOrdersApi() {
  return await apiRequest('/artisan/orders', { method: 'GET' })
}

/**
 * Update order fulfillment status (Processing, Ready to ship, Shipped, Completed, Rejected)
 */
export async function updateArtisanOrderStatusApi(orderId, status) {
  return await apiRequest(`/artisan/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * Fetch expert training courses available for artisans
 */
export async function getArtisanCoursesApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/artisan/courses${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Fetch single course details by ID
 */
export async function getArtisanCourseByIdApi(courseId) {
  return await apiRequest(`/artisan/courses/${courseId}`, {
    method: 'GET',
  })
}

/**
 * Fetch artisan profile info
 */
export async function getArtisanProfileApi() {
  return await apiRequest('/artisan/profile', { method: 'GET' })
}

/**
 * Update artisan profile info
 */
export async function updateArtisanProfileApi(profileData) {
  return await apiRequest('/artisan/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

/**
 * Upload artisan profile photo to Cloudinary
 * @param {File} file
 */
export async function uploadArtisanProfilePhotoApi(file) {
  const formData = new FormData()
  formData.append('photo', file)

  return await apiRequest('/artisan/profile/photo', {
    method: 'POST',
    body: formData,
  })
}

/**
 * Remove artisan profile photo
 */
export async function removeArtisanProfilePhotoApi() {
  return await apiRequest('/artisan/profile/photo', {
    method: 'DELETE',
  })
}

/**
 * Fetch payouts and payment history for completed orders
 */
export async function getArtisanPaymentsApi() {
  return await apiRequest('/artisan/payments', { method: 'GET' })
}

/**
 * Fetch available responsible projects posted by industry partners
 */
export async function getAvailableResponsibleProjectsApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/artisan/responsible-projects${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Artisan accepts and takes on a responsible project
 */
export async function takeResponsibleProjectApi(projectId, payload = {}) {
  return await apiRequest(`/artisan/responsible-projects/${projectId}/take`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
