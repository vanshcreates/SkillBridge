const PROFILE_IMAGES_KEY = 'skillbridge-profile-images'
const LEGACY_ARTISAN_PROFILE_IMAGES_KEY = 'skillbridge-artisan-profile-images'
const PROFILE_IMAGE_CHANGED_EVENT = 'skillbridge:profile-image-changed'

function getOwnerId(user) {
  return user?.id ?? user?.email?.trim().toLowerCase() ?? 'guest'
}

function readProfileImages() {
  const images = {}
  for (const key of [LEGACY_ARTISAN_PROFILE_IMAGES_KEY, PROFILE_IMAGES_KEY]) {
    const storedImages = window.localStorage.getItem(key)
    if (!storedImages) continue

    try {
      const parsedImages = JSON.parse(storedImages)
      if (
        !parsedImages ||
        Array.isArray(parsedImages) ||
        typeof parsedImages !== 'object'
      ) {
        throw new Error('Saved profile images have an invalid format.')
      }
      Object.assign(images, parsedImages)
    } catch (error) {
      console.error('Saved profile images are invalid.', error)
      throw new Error('Your profile photo could not be read. Clear app storage and try again.')
    }
  }
  return images
}

export function getProfileImage(user) {
  return readProfileImages()[getOwnerId(user)] ?? ''
}

export function saveProfileImage(user, imageData) {
  const images = readProfileImages()
  images[getOwnerId(user)] = imageData

  try {
    window.localStorage.setItem(PROFILE_IMAGES_KEY, JSON.stringify(images))
  } catch (error) {
    console.error('Unable to save profile photo.', error)
    throw new Error('Your profile photo could not be saved. Try a smaller image.')
  }
  window.dispatchEvent(new Event(PROFILE_IMAGE_CHANGED_EVENT))

  return imageData
}

export function removeProfileImage(user) {
  const images = readProfileImages()
  delete images[getOwnerId(user)]

  try {
    window.localStorage.setItem(PROFILE_IMAGES_KEY, JSON.stringify(images))
  } catch (error) {
    console.error('Unable to remove profile photo.', error)
    throw new Error('Your profile photo could not be removed. Please try again.')
  }
  window.dispatchEvent(new Event(PROFILE_IMAGE_CHANGED_EVENT))
}

export function readProfileImageFile(file) {
  if (!file || (!file.name && file.size === 0)) return Promise.resolve('')
  if (file.size === 0) {
    return Promise.reject(new Error('Choose a non-empty image file.'))
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Choose a JPG, PNG, or WebP image.'))
  }
  if (file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error('Choose an image smaller than 2 MB.'))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () =>
      reject(new Error('The selected photo could not be read. Please try again.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected photo could not be read. Please try again.'))
        return
      }
      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export const getArtisanProfileImage = getProfileImage
export const saveArtisanProfileImage = saveProfileImage
export const removeArtisanProfileImage = removeProfileImage
export { PROFILE_IMAGE_CHANGED_EVENT }
