import { apiRequest } from './auth-api'

/**
 * Fetch industry dashboard stats, projects, orders, and recent notifications
 */
export async function getIndustryDashboardApi() {
  return await apiRequest('/industry/dashboard', { method: 'GET' })
}

/**
 * Fetch projects / production requests created by industry partner
 */
export async function getIndustryProjectsApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/industry/projects${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Fetch a single industry project by ID
 */
export async function getIndustryProjectByIdApi(projectId) {
  return await apiRequest(`/industry/projects/${projectId}`, {
    method: 'GET',
  })
}

/**
 * Create a new product / project request (with optional direct artisan assignment)
 */
export async function createIndustryProjectApi(projectData) {
  return await apiRequest('/industry/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  })
}

/**
 * Assign or reassign a project to a specific artisan according to price and time duration
 */
export async function assignProjectToArtisanApi(projectId, assignmentData) {
  return await apiRequest(`/industry/projects/${projectId}/assign`, {
    method: 'POST',
    body: JSON.stringify(assignmentData),
  })
}

/**
 * On-the-fly feasibility, fair-wage, and artisan recommendation analysis
 */
export async function analyzeProjectApi(projectDraft) {
  return await apiRequest('/industry/projects/analyze', {
    method: 'POST',
    body: JSON.stringify(projectDraft),
  })
}

/**
 * Fetch notifications for industry partner (e.g. artisan acceptance updates)
 */
export async function getIndustryNotificationsApi() {
  return await apiRequest('/industry/notifications', {
    method: 'GET',
  })
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadApi(notificationId) {
  return await apiRequest(`/industry/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

/**
 * Mark all industry notifications as read
 */
export async function markAllNotificationsReadApi() {
  return await apiRequest('/industry/notifications/mark-all-read', {
    method: 'PATCH',
  })
}

/**
 * Fetch available artisans with skill categories and ratings for industry assignment
 */
export async function getAvailableArtisansForIndustryApi(params = {}) {
  const query = new URLSearchParams(params).toString()
  return await apiRequest(`/industry/artisans${query ? `?${query}` : ''}`, {
    method: 'GET',
  })
}

