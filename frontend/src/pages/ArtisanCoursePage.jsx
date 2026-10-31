import { createElement, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  PlayCircle,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import CourseVideo from '../components/training/CourseVideo'
import ArtisanLayout from '../components/layout/ArtisanLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { baseCourses } from '../data/training-courses'
import { getArtisanCourseByIdApi } from '../services/artisan-api'

const ArtisanCoursePage = () => {
  const { courseId } = useParams()
  const { currentUser } = useAuthDialog()
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0)
  const [liveCourse, setLiveCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const initialCourse = baseCourses.find(
    (entry) => entry.id === courseId || entry._id === courseId,
  )

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getArtisanCourseByIdApi(courseId)
      .then((res) => {
        if (isMounted && res?.success && res.course) {
          setLiveCourse({
            ...res.course,
            lessons: (res.course.lessons ?? []).map((lesson) =>
              typeof lesson === 'string'
                ? { title: lesson, videoUrl: '' }
                : lesson,
            ),
            outcomes: Array.isArray(res.course.outcomes) ? res.course.outcomes : [],
          })
        }
      })
      .catch((err) => {
        if (isMounted) setApiError(err.message || '')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [courseId])

  if (!currentUser) {
    return <Navigate replace to="/artisan/auth" />
  }
  if (currentUser.accountType !== 'artisan') {
    return <Navigate replace to="/marketplace" />
  }

  const course = liveCourse || initialCourse

  if (!course && !isLoading) {
    return (
      <ArtisanLayout>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
          <BookOpenCheck aria-hidden="true" className="mx-auto h-10 w-10 text-secondary" />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-text-main">
            Course not found
          </h1>
          <p className="mt-3 leading-7 text-text-secondary">
            {apiError || 'This course may have been removed or its link may be incorrect.'}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
            to="/artisan/profile"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Return to your artisan page
          </Link>
        </main>
      </ArtisanLayout>
    )
  }

  if (!course && isLoading) {
    return (
      <ArtisanLayout>
        <main className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <p className="text-base text-text-muted">Loading masterclass details...</p>
        </main>
      </ArtisanLayout>
    )
  }

  const lessons = course.lessons.map((lesson) =>
    typeof lesson === 'string'
      ? { title: lesson, videoUrl: '' }
      : lesson,
  )
  const selectedLesson = lessons[selectedLessonIndex] || lessons[0] || { title: 'Intro', videoUrl: '' }
  const CourseIcon = course.icon ?? GraduationCap

  return (
    <ArtisanLayout>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/artisan/profile"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to artisan page
        </Link>

        <header className="mt-6 overflow-hidden rounded-2xl bg-primary text-white">
          <div className="px-5 py-8 sm:px-9 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              {course.category} · {course.level}
            </p>
            <h1 className="mt-3 max-w-4xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-white/85">
              {course.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <GraduationCap aria-hidden="true" className="h-4 w-4" />
                {course.instructor}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                {course.duration}
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
                {lessons.length} modules
              </span>
            </div>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
          <section
            aria-labelledby="lesson-heading"
            className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6"
          >
            <div className="mb-4">
              <p className="text-sm font-semibold text-secondary">
                MODULE {selectedLessonIndex + 1} OF {lessons.length}
              </p>
              <h2
                className="mt-1 font-serif text-2xl font-semibold text-text-main"
                id="lesson-heading"
              >
                {selectedLesson.title}
              </h2>
            </div>
            {selectedLesson.videoUrl ? (
              <CourseVideo
                title={`${course.title}: ${selectedLesson.title}`}
                url={selectedLesson.videoUrl}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-primary px-6 text-center text-white">
                <PlayCircle aria-hidden="true" className="h-12 w-12 text-white/80" />
                <p className="mt-4 font-semibold">Video lesson coming soon</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
                  The instructor hasn&apos;t attached a video to this module yet. Review the notes and practice outline below.
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="font-serif text-xl font-semibold text-text-main">
                Course modules
              </h2>
              <ol className="mt-4 space-y-2">
                {lessons.map((lesson, index) => {
                  const isCurrent = index === selectedLessonIndex
                  return (
                    <li key={`${course.id}-${index}`}>
                      <button
                        className={`w-full rounded-xl p-3 text-left transition ${
                          isCurrent
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-background text-text-main hover:bg-surface-muted'
                        }`}
                        onClick={() => setSelectedLessonIndex(index)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent ? 'text-secondary-light' : 'text-secondary'
                            }`}
                          >
                            Module {index + 1}
                          </span>
                          <span
                            className={`text-xs ${
                              isCurrent ? 'text-white/80' : 'text-text-muted'
                            }`}
                          >
                            {lesson.videoUrl ? 'Video' : 'Outline'}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-medium">
                          {lesson.title}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                  {createElement(CourseIcon, {
                    'aria-hidden': true,
                    className: 'h-5 w-5',
                  })}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    Your instructor
                  </p>
                  <h2 className="font-semibold text-text-main">{course.instructor}</h2>
                </div>
              </div>
              {course.expertise && (
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {course.expertise}
                </p>
              )}
            </section>

            {course.outcomes.length > 0 && (
              <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <h2 className="font-serif text-xl font-semibold text-text-main">
                  What you’ll learn
                </h2>
                <ul className="mt-4 space-y-3">
                  {course.outcomes.map((outcome) => (
                    <li
                      className="flex gap-2 text-sm leading-6 text-text-secondary"
                      key={outcome}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 shrink-0 text-success"
                      />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </main>
    </ArtisanLayout>
  )
}

export default ArtisanCoursePage
