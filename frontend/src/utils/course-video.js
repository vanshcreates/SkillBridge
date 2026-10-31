export function getCourseVideoSource(value) {
  if (typeof value !== 'string' || !value.trim()) return null

  // Support blob or data URLs for immediate local preview
  if (value.startsWith('blob:') || value.startsWith('data:video/')) {
    return { type: 'video', src: value }
  }

  let url
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null

  const host = url.hostname.toLowerCase()
  let videoId

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0]
  } else if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com'
  ) {
    videoId =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]
  } else if (host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
    videoId = url.pathname.match(/^\/embed\/([^/?]+)/)?.[1]
  }

  if (videoId && /^[\w-]{6,}$/.test(videoId)) {
    return {
      type: 'embed',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`,
    }
  }

  const vimeoVideoId =
    host === 'vimeo.com' || host === 'www.vimeo.com'
      ? url.pathname.match(/^\/(\d+)\/?$/)?.[1]
      : host === 'player.vimeo.com'
        ? url.pathname.match(/^\/video\/(\d+)\/?$/)?.[1]
        : null

  if (vimeoVideoId) {
    return {
      type: 'embed',
      src: `https://player.vimeo.com/video/${vimeoVideoId}`,
    }
  }

  // Cloudinary video URLs (with or without direct video extension)
  if (
    host.includes('cloudinary.com') ||
    url.pathname.includes('/video/upload/') ||
    /\.(mp4|webm|ogg|mov|m4v|mkv|avi|flv)$/i.test(url.pathname)
  ) {
    return { type: 'video', src: url.href }
  }

  return null
}

/**
 * Reads local video file metadata in the browser and returns the duration in seconds
 * @param {File|Blob} file
 * @returns {Promise<number>} duration in seconds
 */
export function getVideoDuration(file) {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      return resolve(0)
    }

    try {
      const video = document.createElement('video')
      video.preload = 'metadata'
      const url = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(video.duration || 0)
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(0)
      }

      video.src = url
    } catch {
      resolve(0)
    }
  })
}

/**
 * Parses duration string (e.g. "1 hr 20 min", "15 min", "45 sec", "750s") into total seconds
 * @param {string} str
 * @returns {number} seconds
 */
export function parseDurationToSeconds(str) {
  if (!str || typeof str !== 'string') return 0
  const s = str.toLowerCase().trim()
  let total = 0

  const hrMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)/)
  if (hrMatch) total += parseFloat(hrMatch[1]) * 3600

  const minMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|m)(?!s)/)
  if (minMatch) total += parseFloat(minMatch[1]) * 60

  const secMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:sec|second|s)(?!e)/)
  if (secMatch) total += parseFloat(secMatch[1])

  if (total === 0) {
    const num = parseFloat(s)
    if (!isNaN(num) && num > 0) total = num
  }

  return Math.round(total)
}

/**
 * Formats duration in seconds into a friendly string: "45 sec", "12 min", "1 hr 15 min"
 * @param {number|string} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || Number(seconds) <= 0) return ''
  const totalSecs = Math.round(Number(seconds))
  const hrs = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  if (hrs > 0) {
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`
  }
  if (mins > 0) {
    return secs > 10 ? `${mins} min ${secs} sec` : `${mins} min`
  }
  return `${secs} sec`
}

/**
 * Calculates total course duration from an array of lessons
 * @param {Array} lessons
 * @returns {string} formatted total duration
 */
export function calculateTotalCourseDuration(lessons) {
  if (!Array.isArray(lessons) || lessons.length === 0) return ''
  let totalSecs = 0
  for (const lesson of lessons) {
    if (lesson?.durationSeconds && lesson.durationSeconds > 0) {
      totalSecs += Number(lesson.durationSeconds)
    } else if (lesson?.duration) {
      totalSecs += parseDurationToSeconds(lesson.duration)
    }
  }
  return totalSecs > 0 ? formatDuration(totalSecs) : ''
}
