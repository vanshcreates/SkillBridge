import { useState } from 'react'
import { getCourseVideoSource } from '../../utils/course-video'

const CourseVideo = ({ title, url }) => {
  const source = getCourseVideoSource(url)
  if (!source) return null

  if (source.type === 'video') {
    return (
      <video
        className="aspect-video w-full rounded-lg bg-black"
        controls
        preload="metadata"
        src={source.src}
      >
        Your browser does not support video playback.
      </video>
    )
  }

  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-lg bg-black"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      src={source.src}
      title={title}
    />
  )
}

export function CourseVideoDisclosure({ title, url }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <details
      className="mt-2"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="w-fit cursor-pointer font-semibold text-primary hover:underline">
        Watch lesson video
      </summary>
      {isOpen && (
        <div className="mt-3">
          <CourseVideo title={title} url={url} />
        </div>
      )}
    </details>
  )
}

export default CourseVideo
