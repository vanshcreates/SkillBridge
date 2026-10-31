import { apiRequest } from './auth-api'

/**
 * Fetch expert dashboard metrics and stats
 */
export async function getExpertDashboardApi() {
  return await apiRequest('/expert/dashboard', { method: 'GET' })
}

/**
 * Fetch courses created by the current expert with optional filters & pagination
 * @param {Object} params - { page, limit, category, search, status }
 */
export async function getExpertCoursesApi(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )
  const queryString = new URLSearchParams(cleanParams).toString()
  return await apiRequest(`/expert/courses${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
  })
}

/**
 * Fetch a single course by its ID
 */
export async function getExpertCourseByIdApi(courseId) {
  return await apiRequest(`/expert/courses/${courseId}`, { method: 'GET' })
}

/**
 * Create and publish a new training course
 * @param {Object} courseData
 */
export async function createExpertCourseApi(courseData) {
  return await apiRequest('/expert/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  })
}

/**
 * Update an existing course
 */
export async function updateExpertCourseApi(courseId, courseData) {
  return await apiRequest(`/expert/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  })
}

/**
 * Toggle publish status (Published vs Draft)
 */
export async function toggleCoursePublishApi(courseId, isPublished) {
  return await apiRequest(`/expert/courses/${courseId}/publish`, {
    method: 'PATCH',
    body: JSON.stringify(isPublished !== undefined ? { isPublished } : {}),
  })
}

/**
 * Delete a course
 */
export async function deleteExpertCourseApi(courseId) {
  return await apiRequest(`/expert/courses/${courseId}`, {
    method: 'DELETE',
  })
}

/**
 * Fetch paginated video lessons for a specific course
 * @param {string} courseId
 * @param {Object} params - { page, limit }
 */
export async function getCourseLessonsApi(courseId, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return await apiRequest(
    `/expert/courses/${courseId}/lessons${queryString ? `?${queryString}` : ''}`,
    { method: 'GET' }
  )
}

/**
 * Add a new video lesson to an existing course
 */
export async function addCourseLessonApi(courseId, lessonData) {
  return await apiRequest(`/expert/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData),
  })
}

/**
 * Update a video lesson
 */
export async function updateCourseLessonApi(courseId, lessonId, lessonData) {
  return await apiRequest(`/expert/courses/${courseId}/lessons/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(lessonData),
  })
}

/**
 * Delete a video lesson from a course
 */
export async function deleteCourseLessonApi(courseId, lessonId) {
  return await apiRequest(`/expert/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
  })
}

/**
 * Fetch expert profile
 */
export async function getExpertProfileApi() {
  return await apiRequest('/expert/profile', { method: 'GET' })
}

/**
 * Update expert profile details
 */
export async function updateExpertProfileApi(profileData) {
  return await apiRequest('/expert/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

