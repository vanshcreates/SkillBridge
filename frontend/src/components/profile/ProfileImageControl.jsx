import { useEffect, useRef, useState } from 'react'
import { Camera, UserRound, X } from 'lucide-react'
import {
  getProfileImage,
  PROFILE_IMAGE_CHANGED_EVENT,
  readProfileImageFile,
  removeProfileImage,
  saveProfileImage,
} from '../../utils/artisan-profile-storage'

const sizes = {
  small: 'h-10 w-10 text-base',
  medium: 'h-12 w-12 text-lg',
  hero: 'h-16 w-16 text-2xl',
  large: 'h-24 w-24 text-3xl',
}

function loadImage(user) {
  try {
    return getProfileImage(user)
  } catch (error) {
    console.error('Unable to load profile photo.', error)
    return ''
  }
}

const ProfileImageControl = ({ user, size = 'medium', className = '' }) => {
  const [image, setImage] = useState(() => loadImage(user))
  const [isOpen, setIsOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const fileInputRef = useRef(null)
  const displayName = user?.name || user?.contactName || user?.email || 'Profile'

  useEffect(() => {
    const refreshImage = () => setImage(loadImage(user))
    refreshImage()
    window.addEventListener(PROFILE_IMAGE_CHANGED_EVENT, refreshImage)
    return () =>
      window.removeEventListener(PROFILE_IMAGE_CHANGED_EVENT, refreshImage)
  }, [user])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setNotice('')
    setNoticeIsError(false)
    if (!file) return

    try {
      const imageData = await readProfileImageFile(file)
      setImage(saveProfileImage(user, imageData))
      setNotice('Your profile photo has been saved in this browser.')
    } catch (error) {
      setNotice(error.message || 'Unable to save your profile photo.')
      setNoticeIsError(true)
    }
  }

  const handleRemoveImage = () => {
    setNotice('')
    setNoticeIsError(false)
    try {
      removeProfileImage(user)
      setImage('')
      setNotice('Your profile photo has been removed.')
    } catch (error) {
      setNotice(error.message || 'Unable to remove your profile photo.')
      setNoticeIsError(true)
    }
  }

  return (
    <>
      <button
        aria-label={`View ${displayName}'s profile photo`}
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted text-secondary transition hover:ring-2 hover:ring-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${sizes[size] || sizes.medium} ${className}`}
        onClick={() => {
          setNotice('')
          setIsOpen(true)
        }}
        type="button"
      >
        {image ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={image}
          />
        ) : displayName ? (
          <span aria-hidden="true" className="font-semibold text-primary">
            {displayName.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound aria-hidden="true" className="h-1/2 w-1/2" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <section
            aria-labelledby="profile-photo-dialog-title"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
            role="dialog"
          >
            <button
              aria-label="Close profile photo"
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <h2
              className="pr-10 font-serif text-xl font-semibold text-text-main"
              id="profile-photo-dialog-title"
            >
              {displayName}'s profile photo
            </h2>
            <div className="mt-5 flex min-h-64 items-center justify-center rounded-xl bg-background p-4">
              {image ? (
                <img
                  alt={`${displayName}'s profile`}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain"
                  src={image}
                />
              ) : (
                <UserRound aria-hidden="true" className="h-24 w-24 text-secondary" />
              )}
            </div>
            <p className="mt-3 text-sm text-text-muted">
              JPG, PNG, or WebP up to 2 MB. Photos are stored locally for now.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
                {image ? 'Change photo' : 'Add photo'}
              </button>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleImageChange}
                ref={fileInputRef}
                type="file"
              />
              {image && (
                <button
                  className="min-h-10 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  onClick={handleRemoveImage}
                  type="button"
                >
                  Remove photo
                </button>
              )}
              {notice && (
                <p
                  aria-live="polite"
                  className={`text-sm ${noticeIsError ? 'text-error' : 'text-success'}`}
                  role={noticeIsError ? 'alert' : 'status'}
                >
                  {notice}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default ProfileImageControl
