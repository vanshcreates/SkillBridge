export function getCourseVideoSource(value) {
  if (typeof value !== 'string' || !value.trim()) return null

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

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { type: 'video', src: url.href }
  }

  return null
}
