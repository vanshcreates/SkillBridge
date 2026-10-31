import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'

const ProfileImageSignupField = ({ className = '' }) => {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <label className={`block text-sm font-medium text-text-main ${className}`}>
      Profile photo <span className="font-normal text-text-muted">(optional)</span>
      <span className="mt-1.5 flex min-h-12 items-center gap-3 rounded-lg border border-border bg-white px-3.5 py-2 text-text-secondary focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/25">
        {previewUrl ? (
          <img
            alt="Selected profile photo preview"
            className="h-9 w-9 rounded-full object-cover"
            src={previewUrl}
          />
        ) : (
          <Camera aria-hidden="true" className="h-5 w-5 shrink-0 text-secondary" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {file?.name || 'Choose a photo'}
        </span>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          name="profileImage"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </span>
      <span className="mt-1 block text-xs font-normal text-text-muted">
        JPG, PNG, or WebP up to 2 MB.
      </span>
    </label>
  )
}

export default ProfileImageSignupField
