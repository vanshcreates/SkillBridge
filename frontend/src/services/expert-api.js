import { apiRequest, getAuthToken } from './auth-api'

const API_BASE_URL =
  import.meta.env?.VITE_API_URL || 'http://localhost:8000/api'

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
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
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
 * Upload a local video file to cloud storage (Cloudinary)
 * @param {File} file
 */
export async function uploadCourseVideoApi(file) {
  const formData = new FormData()
  formData.append('video', file)

  const token = getAuthToken()
  const res = await fetch(`${API_BASE_URL}/expert/upload-video`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to upload video file.')
  }
  return data
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
  if (lessonData instanceof FormData) {
    const token = getAuthToken()
    const res = await fetch(`${API_BASE_URL}/expert/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: lessonData,
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to add video lesson.')
    }
    return data
  }

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


/**
 * Fetch products in the expert evaluation queue
 * @param {Object} params - { status: 'all'|'pending'|'evaluated'|'rejected', category, search }
 */
export async function getExpertEvaluationQueueApi(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const queryString = new URLSearchParams(cleanParams).toString()
  return await apiRequest(
    `/expert/evaluations/queue${queryString ? `?${queryString}` : ''}`,
    { method: 'GET' }
  )
}

/**
 * Fetch details of a product being evaluated
 * @param {string} productId
 */
export async function getEvaluationProductByIdApi(productId) {
  return await apiRequest(`/expert/evaluations/product/${productId}`, {
    method: 'GET',
  })
}

/**
 * Mark a product as 'Under Evaluation'
 * @param {string} productId
 */
export async function startProductEvaluationApi(productId) {
  return await apiRequest(`/expert/evaluations/product/${productId}/start`, {
    method: 'PATCH',
  })
}

/**
 * Submit expert evaluation across 5 criteria (1-10 each), feedback, and verdict
 * @param {string} productId
 * @param {Object} evaluationData
 */
export async function submitProductEvaluationApi(productId, evaluationData) {
  return await apiRequest(`/expert/evaluations/product/${productId}/evaluate`, {
    method: 'POST',
    body: JSON.stringify(evaluationData),
  })
}

/**
 * Self-verify expert account for evaluation testing / instant access
 */
export async function verifyExpertStatusApi() {
  return await apiRequest('/expert/verify-status', {
    method: 'POST',
  })
}
