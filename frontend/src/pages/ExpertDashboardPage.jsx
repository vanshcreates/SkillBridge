import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Plus,
  UsersRound,
} from 'lucide-react'
import ExpertLayout from '../components/layout/ExpertLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
import {
  getExpertCourses,
  saveExpertCourse,
} from '../utils/training-storage'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

function readCourses() {
  try {
    return { courses: getExpertCourses(), error: '' }
  } catch (error) {
    console.error('Unable to load training courses.', error)
    return {
      courses: [],
      error: error.message || 'Published courses could not be loaded.',
    }
  }
}

const ExpertDashboardPage = () => {
  const { currentUser } = useAuthDialog()
  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [lessonDrafts, setLessonDrafts] = useState([
    { id: 1, title: '', videoUrl: '' },
  ])
  const nextLessonId = useRef(2)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const [courseState, setCourseState] = useState(() => readCourses())
  const { courses, error: loadError } = courseState
  const expertCourses = courses.filter((course) => course.expertId === currentUser?.id)

  if (!currentUser) {
    return <Navigate replace to="/expert/auth" />
  }
  if (currentUser.accountType !== 'expert') {
    return <Navigate replace to="/marketplace" />
  }

  const handlePublishCourse = (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)
    const formData = new FormData(event.currentTarget)

    try {
      const course = saveExpertCourse(currentUser, {
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        duration: formData.get('duration'),
        level: formData.get('level'),
        lessons: lessonDrafts,
        outcomes: formData.get('outcomes'),
      })
      setCourseState((state) => ({
        courses: [course, ...state.courses],
        error: '',
      }))
      setCourseFormOpen(false)
      setLessonDrafts([{ id: 1, title: '', videoUrl: '' }])
      nextLessonId.current = 2
      setNotice('Your course is published to the artisan training library.')
      event.currentTarget.reset()
    } catch (error) {
      setNotice(error.message || 'Unable to publish your course.')
      setNoticeIsError(true)
    }
  }

  return (
    <ExpertLayout>
      <main className="w-full px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="relative overflow-hidden bg-primary px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="absolute -right-12 -top-32 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                  Expert workspace
                </p>
                <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                  Welcome, {currentUser.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  Create practical courses and share your knowledge with artisans.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Training expert
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div>
              <p className="font-semibold text-text-main">
                {currentUser.expertise || 'Course educator'}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                {currentUser.email}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={() => {
                setNotice('')
                setCourseFormOpen((isOpen) => !isOpen)
              }}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {courseFormOpen ? 'Close course form' : 'Add a course'}
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Courses you created</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-text-main">
              {expertCourses.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Course status</p>
            <p className="mt-3 font-serif text-xl font-semibold text-text-main">
              Published to library
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Learners</p>
            <p className="mt-3 inline-flex items-center gap-2 font-serif text-xl font-semibold text-text-main">
              <UsersRound aria-hidden="true" className="h-5 w-5 text-secondary" />
              Course analytics coming soon
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-secondary">YOUR TEACHING</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
              My courses
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Courses you publish are available to artisans in the Training library.
            </p>
          </div>

          {(notice || loadError) && (
            <p
              className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                noticeIsError || loadError
                  ? 'border-error/30 bg-red-50 text-error'
                  : 'border-success/30 bg-green-50 text-success'
              }`}
              role={noticeIsError || loadError ? 'alert' : 'status'}
            >
              {loadError || notice}
            </p>
          )}

          {courseFormOpen && (
            <form
              className="mb-6 grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-2 sm:p-6"
              onSubmit={handlePublishCourse}
            >
              <div className="sm:col-span-2">
                <h3 className="font-serif text-xl font-semibold text-text-main">
                  Create a course
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Add a clear outline so learners know what they will learn.
                </p>
              </div>
              <label className="text-sm font-medium text-text-main">
                Course title
                <input
                  className={fieldClass}
                  maxLength={100}
                  name="title"
                  placeholder="e.g. Natural dyeing with local plants"
                  required
                />
              </label>
              <label className="text-sm font-medium text-text-main">
                Craft or topic
                <input
                  className={fieldClass}
                  maxLength={60}
                  name="category"
                  placeholder="e.g. Textile arts"
                  required
                />
              </label>
              <label className="text-sm font-medium text-text-main">
                Duration
                <input
                  className={fieldClass}
                  maxLength={40}
                  name="duration"
                  placeholder="e.g. 1 hr 20 min"
                  required
                />
              </label>
              <label className="text-sm font-medium text-text-main">
                Learner level
                <select className={fieldClass} defaultValue="Beginner" name="level">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>All levels</option>
                </select>
              </label>
              <label className="text-sm font-medium text-text-main sm:col-span-2">
                Course description
                <textarea
                  className={fieldClass}
                  maxLength={500}
                  name="description"
                  placeholder="What does this course teach, and who is it for?"
                  required
                  rows="3"
                />
              </label>
              <fieldset className="grid gap-4 sm:col-span-2">
                <legend className="font-semibold text-text-main">
                  Course videos
                </legend>
                <p className="-mt-2 text-sm leading-6 text-text-secondary">
                  Add each lesson separately with a YouTube, Vimeo, or direct
                  video link. Lessons appear in this order in the artisan library.
                </p>
                {lessonDrafts.map((lesson, index) => (
                  <div
                    className="grid gap-4 rounded-lg border border-border bg-white p-4 sm:grid-cols-2"
                    key={lesson.id}
                  >
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                      <h4 className="font-semibold text-text-main">
                        Lesson {index + 1}
                      </h4>
                      {lessonDrafts.length > 1 && (
                        <button
                          className="rounded px-2 py-1 text-sm font-medium text-error hover:bg-red-50"
                          onClick={() =>
                            setLessonDrafts((drafts) =>
                              drafts.filter((entry) => entry.id !== lesson.id),
                            )
                          }
                          type="button"
                        >
                          Remove lesson
                        </button>
                      )}
                    </div>
                    <label className="text-sm font-medium text-text-main">
                      Lesson title
                      <input
                        className={fieldClass}
                        maxLength={100}
                        name={`lessonTitle-${lesson.id}`}
                        onChange={(event) =>
                          setLessonDrafts((drafts) =>
                            drafts.map((entry) =>
                              entry.id === lesson.id
                                ? { ...entry, title: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="e.g. Preparing the loom"
                        required
                        value={lesson.title}
                      />
                    </label>
                    <label className="text-sm font-medium text-text-main">
                      Video URL
                      <input
                        className={fieldClass}
                        name={`lessonVideo-${lesson.id}`}
                        onChange={(event) =>
                          setLessonDrafts((drafts) =>
                            drafts.map((entry) =>
                              entry.id === lesson.id
                                ? { ...entry, videoUrl: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="https://youtu.be/..."
                        required
                        type="url"
                        value={lesson.videoUrl}
                      />
                    </label>
                  </div>
                ))}
                <button
                  className="min-h-10 w-fit rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  onClick={() => {
                    const id = nextLessonId.current
                    nextLessonId.current += 1
                    setLessonDrafts((drafts) => [
                      ...drafts,
                      { id, title: '', videoUrl: '' },
                    ])
                  }}
                  type="button"
                >
                  Add another lesson
                </button>
              </fieldset>
              <label className="text-sm font-medium text-text-main sm:col-span-2">
                Learner outcomes <span className="font-normal text-text-muted">(one outcome per line)</span>
                <textarea
                  className={fieldClass}
                  maxLength={800}
                  name="outcomes"
                  placeholder={'Choose the right materials\nPractice the core technique'}
                  rows="3"
                />
              </label>
              <button
                className="min-h-11 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover sm:col-span-2"
                type="submit"
              >
                Publish course
              </button>
            </form>
          )}

          {expertCourses.length ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {expertCourses.map((course) => (
                <article
                  className="flex h-full flex-col rounded-xl border border-border bg-background p-5"
                  key={course.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                      <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
                      Published
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                    {course.category}
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-semibold text-text-main">
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                    {course.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-sm text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 aria-hidden="true" className="h-4 w-4" />
                      {course.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
                      {course.lessons.length} lessons
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap aria-hidden="true" className="h-4 w-4" />
                      {course.level}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {course.lessons.map((lesson, index) => (
                      <li
                        className="flex items-center justify-between gap-3 text-sm text-text-secondary"
                        key={`${course.id}-${index}`}
                      >
                        <span className="truncate">
                          {index + 1}. {typeof lesson === 'string' ? lesson : lesson.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
                          {typeof lesson === 'string' || !lesson.videoUrl
                            ? 'Outline'
                            : 'Video'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            !courseFormOpen && (
              <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                <BookOpenCheck aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
                <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                  Your first course starts here
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                  Turn your knowledge into a step-by-step course that artisans
                  can discover in their Training section.
                </p>
                <button
                  className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                  onClick={() => setCourseFormOpen(true)}
                  type="button"
                >
                  Create your first course
                </button>
              </div>
            )
          )}
        </section>
      </main>
    </ExpertLayout>
  )
}

export default ExpertDashboardPage
