import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Play,
  Plus,
  Search,
  Trash2,
  UsersRound,
  Video,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import ExpertLayout from '../components/layout/ExpertLayout'
import CourseVideo from '../components/training/CourseVideo'
import { useAuthDialog } from '../hooks/useAuthDialog'
import {
  getExpertDashboardApi,
  getExpertCoursesApi,
  createExpertCourseApi,
  toggleCoursePublishApi,
  deleteExpertCourseApi,
  addCourseLessonApi,
  deleteCourseLessonApi,
} from '../services/expert-api'
import {
  getExpertCourses,
  saveExpertCourse,
} from '../utils/training-storage'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const LESSONS_PER_PAGE = 3

const ExpertDashboardPage = () => {
  const { currentUser } = useAuthDialog()
  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [lessonDrafts, setLessonDrafts] = useState([
    { id: 1, title: '', videoUrl: '', duration: '' },
  ])
  const nextLessonId = useRef(2)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Dashboard metrics state
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalLessons: 0,
    totalLearners: 0,
  })

  // Courses and pagination state
  const [courses, setCourses] = useState([])
  const [coursePage, setCoursePage] = useState(1)
  const [totalCoursePages, setTotalCoursePages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Per-course video lessons pagination state: { [courseId]: pageNumber }
  const [lessonPages, setLessonPages] = useState({})

  // Video preview modal state
  const [activePreview, setActivePreview] = useState(null)

  // Add lesson modal state: { courseId: string, title: string, videoUrl: string, duration: string } | null
  const [newLessonModal, setNewLessonModal] = useState(null)
  const [isAddingLesson, setIsAddingLesson] = useState(false)

  // 1. Fetch dashboard data & courses from backend
  const loadDashboardData = async (targetPage = coursePage) => {
    setIsLoading(true)
    try {
      // 1. Fetch live metrics
      const dashboardRes = await getExpertDashboardApi().catch(() => null)
      if (dashboardRes?.success && dashboardRes.stats) {
        setStats(dashboardRes.stats)
      }

      // 2. Fetch live paginated courses
      const coursesRes = await getExpertCoursesApi({
        page: targetPage,
        limit: 6,
        search: searchQuery,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
      }).catch(() => null)

      if (coursesRes?.success && Array.isArray(coursesRes.courses)) {
        setCourses(coursesRes.courses)
        if (coursesRes.pagination) {
          setTotalCoursePages(coursesRes.pagination.totalPages || 1)
          setCoursePage(coursesRes.pagination.page || 1)
        }
      } else {
        // Fallback to local storage if backend call returned no data
        const localCourses = getExpertCourses().filter(
          (c) => c.expertId === currentUser?.id || c.expertId === currentUser?._id
        )
        setCourses(localCourses)
        setStats((prev) => ({
          ...prev,
          totalCourses: localCourses.length,
          publishedCourses: localCourses.filter((c) => c.isPublished !== false).length,
        }))
      }
    } catch (err) {
      console.warn('Dashboard loading fallback:', err)
      const localCourses = getExpertCourses().filter(
        (c) => c.expertId === currentUser?.id || c.expertId === currentUser?._id
      )
      setCourses(localCourses)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.accountType === 'expert') {
      loadDashboardData(1)
    }
  }, [currentUser, searchQuery, selectedCategory])

  if (!currentUser) {
    return <Navigate replace to="/expert/auth" />
  }
  if (currentUser.accountType !== 'expert') {
    return <Navigate replace to="/marketplace" />
  }

  // 2. Publish new course
  const handlePublishCourse = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get('title')
    const category = formData.get('category')
    const description = formData.get('description')
    const duration = formData.get('duration')
    const level = formData.get('level')
    const outcomesRaw = formData.get('outcomes') || ''

    const validLessons = lessonDrafts
      .filter((l) => l.title.trim())
      .map((l) => ({
        title: l.title.trim(),
        videoUrl: l.videoUrl.trim(),
        duration: l.duration?.trim() || '',
      }))

    if (!validLessons.length) {
      setNotice('Please provide at least one lesson title.')
      setNoticeIsError(true)
      setIsSubmitting(false)
      return
    }

    try {
      // Create via backend API
      const response = await createExpertCourseApi({
        title,
        category,
        description,
        duration,
        level,
        lessons: validLessons,
        outcomes: outcomesRaw,
      })

      if (response?.success && response.course) {
        setCourses((prev) => [response.course, ...prev])
        setStats((prev) => ({
          ...prev,
          totalCourses: prev.totalCourses + 1,
          publishedCourses: prev.publishedCourses + 1,
          totalLessons: prev.totalLessons + validLessons.length,
        }))
        setNotice('Your course has been published to the artisan training library.')
      } else {
        // Fallback local save
        const savedLocal = saveExpertCourse(currentUser, {
          title,
          category,
          description,
          duration,
          level,
          lessons: validLessons,
          outcomes: outcomesRaw,
        })
        setCourses((prev) => [savedLocal, ...prev])
        setNotice('Course saved to your workspace.')
      }

      setCourseFormOpen(false)
      setLessonDrafts([{ id: 1, title: '', videoUrl: '', duration: '' }])
      nextLessonId.current = 2
      event.currentTarget.reset()
    } catch (error) {
      console.error('Course publish error:', error)
      setNotice(error.message || 'Unable to publish your course. Please try again.')
      setNoticeIsError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Toggle Publish / Draft
  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      const res = await toggleCoursePublishApi(courseId, !currentStatus)
      if (res?.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId || c._id === courseId
              ? { ...c, isPublished: res.isPublished }
              : c
          )
        )
        setStats((prev) => ({
          ...prev,
          publishedCourses: res.isPublished
            ? prev.publishedCourses + 1
            : Math.max(0, prev.publishedCourses - 1),
          draftCourses: res.isPublished
            ? Math.max(0, prev.draftCourses - 1)
            : prev.draftCourses + 1,
        }))
        setNotice(
          res.isPublished
            ? 'Course is now published to artisans.'
            : 'Course has been moved to drafts.'
        )
        setNoticeIsError(false)
      }
    } catch (err) {
      setNotice(err.message || 'Failed to update course status.')
      setNoticeIsError(true)
    }
  }

  // 4. Delete Course
  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) {
      return
    }

    try {
      const res = await deleteExpertCourseApi(courseId)
      if (res?.success) {
        setCourses((prev) =>
          prev.filter((c) => c.id !== courseId && c._id !== courseId)
        )
        setStats((prev) => ({
          ...prev,
          totalCourses: Math.max(0, prev.totalCourses - 1),
        }))
        setNotice(`"${courseTitle}" has been deleted.`)
        setNoticeIsError(false)
      }
    } catch (err) {
      setNotice(err.message || 'Failed to delete course.')
      setNoticeIsError(true)
    }
  }

  // 5. Add Video Lesson to existing course
  const handleAddLessonSubmit = async (e) => {
    e.preventDefault()
    if (!newLessonModal) return

    setIsAddingLesson(true)
    try {
      const res = await addCourseLessonApi(newLessonModal.courseId, {
        title: newLessonModal.title,
        videoUrl: newLessonModal.videoUrl,
        duration: newLessonModal.duration,
      })

      if (res?.success && res.course) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === newLessonModal.courseId || c._id === newLessonModal.courseId
              ? res.course
              : c
          )
        )
        setStats((prev) => ({
          ...prev,
          totalLessons: prev.totalLessons + 1,
        }))
        setNotice(`New video lesson added to course.`)
        setNoticeIsError(false)
        setNewLessonModal(null)
      }
    } catch (err) {
      setNotice(err.message || 'Failed to add video lesson.')
      setNoticeIsError(true)
    } finally {
      setIsAddingLesson(false)
    }
  }

  // 6. Delete Video Lesson from course
  const handleDeleteLesson = async (courseId, lessonId, lessonTitle) => {
    if (!window.confirm(`Remove lesson "${lessonTitle}"?`)) return

    try {
      const res = await deleteCourseLessonApi(courseId, lessonId)
      if (res?.success && res.course) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId || c._id === courseId ? res.course : c
          )
        )
        setStats((prev) => ({
          ...prev,
          totalLessons: Math.max(0, prev.totalLessons - 1),
        }))
        setNotice(`Lesson "${lessonTitle}" removed.`)
        setNoticeIsError(false)
      }
    } catch (err) {
      setNotice(err.message || 'Failed to delete lesson.')
      setNoticeIsError(true)
    }
  }

  // Categories list for filtering
  const categories = [
    'All',
    'Textiles',
    'Embroidery',
    'Pottery',
    'Weaving',
    'Woodcraft',
    'Metalcraft',
    'Jewelry',
    'Shop growth',
  ]

  return (
    <ExpertLayout>
      <main className="w-full px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
        {/* Welcome Header */}
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
                  Create practical masterclasses and video lessons to empower artisans.
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
                {currentUser.expertise || 'Mastercraft educator'}
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

        {/* Real-time Metrics */}
        <section className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Total Courses</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-text-main">
              {stats.totalCourses}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Published to Library</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-success">
              {stats.publishedCourses}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Video Lessons</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-text-main">
              {stats.totalLessons}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Artisan Learners</p>
            <p className="mt-2 inline-flex items-center gap-2 font-serif text-2xl font-semibold text-text-main">
              <UsersRound aria-hidden="true" className="h-6 w-6 text-secondary" />
              {stats.totalLearners || 'Active'}
            </p>
          </div>
        </section>

        {/* Course Form */}
        {courseFormOpen && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
            <form
              className="grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-2 sm:p-6"
              onSubmit={handlePublishCourse}
            >
              <div className="sm:col-span-2">
                <h3 className="font-serif text-xl font-semibold text-text-main">
                  Create a Course
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Add a structured outline and video links so artisans can learn step-by-step.
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

              {/* Video Lessons Section */}
              <fieldset className="grid gap-4 sm:col-span-2">
                <legend className="font-semibold text-text-main">
                  Course video lessons
                </legend>
                <p className="-mt-2 text-sm leading-6 text-text-secondary">
                  Add each lesson with a title and video link (YouTube, Vimeo, or direct MP4/WebM).
                </p>
                {lessonDrafts.map((lesson, index) => (
                  <div
                    className="grid gap-4 rounded-lg border border-border bg-white p-4 sm:grid-cols-2"
                    key={lesson.id}
                  >
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                      <h4 className="flex items-center gap-2 font-semibold text-text-main">
                        <Video aria-hidden="true" className="h-4 w-4 text-secondary" />
                        Lesson {index + 1}
                      </h4>
                      {lessonDrafts.length > 1 && (
                        <button
                          className="rounded px-2 py-1 text-sm font-medium text-error hover:bg-red-50"
                          onClick={() =>
                            setLessonDrafts((drafts) =>
                              drafts.filter((entry) => entry.id !== lesson.id)
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
                        onChange={(e) =>
                          setLessonDrafts((drafts) =>
                            drafts.map((entry) =>
                              entry.id === lesson.id
                                ? { ...entry, title: e.target.value }
                                : entry
                            )
                          )
                        }
                        placeholder="e.g. Preparing materials and tools"
                        required
                        value={lesson.title}
                      />
                    </label>
                    <label className="text-sm font-medium text-text-main">
                      Video URL
                      <input
                        className={fieldClass}
                        onChange={(e) =>
                          setLessonDrafts((drafts) =>
                            drafts.map((entry) =>
                              entry.id === lesson.id
                                ? { ...entry, videoUrl: e.target.value }
                                : entry
                            )
                          )
                        }
                        placeholder="https://youtu.be/... or Vimeo"
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
                      { id, title: '', videoUrl: '', duration: '' },
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
                  placeholder={'Choose the right materials\nPractice the core technique\nBuild your first motif'}
                  rows="3"
                />
              </label>

              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  className="min-h-11 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Course'}
                </button>
                <button
                  className="min-h-11 rounded-lg border border-border px-5 py-2.5 font-semibold text-text-secondary hover:bg-surface"
                  onClick={() => setCourseFormOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Courses Section */}
        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">YOUR TEACHING</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
                My Courses
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Courses you publish are accessible to artisans in their Training section.
              </p>
            </div>

            {/* Search and Category filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                />
                <input
                  className="rounded-lg border border-border bg-white py-1.5 pl-9 pr-3 text-sm text-text-main outline-none focus:border-secondary"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your courses..."
                  value={searchQuery}
                />
              </div>
              <select
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-main outline-none focus:border-secondary"
                onChange={(e) => setSelectedCategory(e.target.value)}
                value={selectedCategory}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback banner */}
          {notice && (
            <div
              className={`my-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                noticeIsError
                  ? 'border-error/30 bg-red-50 text-error'
                  : 'border-success/30 bg-green-50 text-success'
              }`}
            >
              <span>{notice}</span>
              <button
                className="text-xs font-semibold hover:underline"
                onClick={() => setNotice('')}
                type="button"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-text-muted">
              Loading courses from server...
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {courses.map((course) => {
                  const courseId = course.id || course._id
                  const isPublished = course.isPublished !== false
                  const allLessons = Array.isArray(course.lessons)
                    ? course.lessons
                    : []
                  
                  // Video lessons pagination for this course card
                  const currentLessonPage = lessonPages[courseId] || 1
                  const totalLessonPages = Math.ceil(allLessons.length / LESSONS_PER_PAGE) || 1
                  const startIdx = (currentLessonPage - 1) * LESSONS_PER_PAGE
                  const currentLessonsSlice = allLessons.slice(
                    startIdx,
                    startIdx + LESSONS_PER_PAGE
                  )

                  return (
                    <article
                      className="flex h-full flex-col rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-secondary/50"
                      key={courseId}
                    >
                      {/* Course Header */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                          <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isPublished
                                ? 'bg-green-50 text-success hover:bg-green-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                            onClick={() => handleTogglePublish(courseId, isPublished)}
                            title="Click to toggle publish status"
                            type="button"
                          >
                            {isPublished ? (
                              <>
                                <Eye aria-hidden="true" className="h-3 w-3" />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff aria-hidden="true" className="h-3 w-3" />
                                Draft
                              </>
                            )}
                          </button>
                          <button
                            aria-label={`Delete course ${course.title}`}
                            className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-error"
                            onClick={() => handleDeleteCourse(courseId, course.title)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                        {course.category}
                      </p>
                      <h3 className="mt-1.5 font-serif text-xl font-semibold text-text-main">
                        {course.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                        {course.description}
                      </p>

                      {/* Course Metadata */}
                      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                          {course.duration || 'Flexible'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpenCheck aria-hidden="true" className="h-3.5 w-3.5" />
                          {allLessons.length} lessons
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
                          {course.level || 'All levels'}
                        </span>
                      </div>

                      {/* Video Lessons with Pagination */}
                      <div className="mt-4 rounded-lg border border-border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                            Video Lessons ({allLessons.length})
                          </span>
                          <button
                            className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                            onClick={() =>
                              setNewLessonModal({
                                courseId,
                                title: '',
                                videoUrl: '',
                                duration: '',
                              })
                            }
                            type="button"
                          >
                            <Plus aria-hidden="true" className="h-3 w-3" />
                            Add lesson
                          </button>
                        </div>

                        {allLessons.length === 0 ? (
                          <p className="mt-2 text-xs text-text-muted">
                            No lessons added yet. Click &quot;Add lesson&quot; to attach video guides.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {currentLessonsSlice.map((lesson, idx) => {
                              const lessonId = lesson.id || lesson._id || `idx-${startIdx + idx}`
                              const lessonTitle =
                                typeof lesson === 'string' ? lesson : lesson.title
                              const hasVideo =
                                typeof lesson !== 'string' && Boolean(lesson.videoUrl)

                              return (
                                <li
                                  className="flex items-center justify-between gap-2 rounded border border-border/50 bg-background px-2.5 py-1.5 text-xs text-text-main"
                                  key={lessonId}
                                >
                                  <div className="min-w-0 flex-1 truncate">
                                    <span className="font-semibold text-secondary">
                                      #{startIdx + idx + 1}{' '}
                                    </span>
                                    <span>{lessonTitle}</span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {hasVideo ? (
                                      <button
                                        className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary hover:bg-primary hover:text-white"
                                        onClick={() =>
                                          setActivePreview({
                                            title: lessonTitle,
                                            url: lesson.videoUrl,
                                          })
                                        }
                                        title="Preview lesson video"
                                        type="button"
                                      >
                                        <Play aria-hidden="true" className="h-3 w-3 fill-current" />
                                        Preview
                                      </button>
                                    ) : (
                                      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.65rem] text-text-muted">
                                        Outline
                                      </span>
                                    )}
                                    <button
                                      aria-label="Remove lesson"
                                      className="rounded p-1 text-text-muted hover:text-error"
                                      onClick={() =>
                                        handleDeleteLesson(
                                          courseId,
                                          lesson._id || String(startIdx + idx),
                                          lessonTitle
                                        )
                                      }
                                      type="button"
                                    >
                                      <Trash2 aria-hidden="true" className="h-3 w-3" />
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}

                        {/* Video Lessons Pagination Controls */}
                        {totalLessonPages > 1 && (
                          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-text-muted">
                            <span>
                              Page {currentLessonPage} of {totalLessonPages}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                className="rounded border border-border p-1 hover:bg-surface disabled:opacity-30"
                                disabled={currentLessonPage <= 1}
                                onClick={() =>
                                  setLessonPages((prev) => ({
                                    ...prev,
                                    [courseId]: Math.max(1, currentLessonPage - 1),
                                  }))
                                }
                                title="Previous lessons"
                                type="button"
                              >
                                <ChevronLeft aria-hidden="true" className="h-3 w-3" />
                              </button>
                              <button
                                className="rounded border border-border p-1 hover:bg-surface disabled:opacity-30"
                                disabled={currentLessonPage >= totalLessonPages}
                                onClick={() =>
                                  setLessonPages((prev) => ({
                                    ...prev,
                                    [courseId]: Math.min(
                                      totalLessonPages,
                                      currentLessonPage + 1
                                    ),
                                  }))
                                }
                                title="Next lessons"
                                type="button"
                              >
                                <ChevronRight aria-hidden="true" className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Course-level Pagination */}
              {totalCoursePages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-text-main hover:bg-background disabled:opacity-40"
                    disabled={coursePage <= 1}
                    onClick={() => loadDashboardData(coursePage - 1)}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm font-medium text-text-secondary">
                    Page {coursePage} of {totalCoursePages}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-text-main hover:bg-background disabled:opacity-40"
                    disabled={coursePage >= totalCoursePages}
                    onClick={() => loadDashboardData(coursePage + 1)}
                    type="button"
                  >
                    Next
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            !courseFormOpen && (
              <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-12 text-center">
                <BookOpenCheck aria-hidden="true" className="mx-auto h-10 w-10 text-secondary" />
                <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                  No courses found
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'No courses matched your search or category filter.'
                    : 'Turn your knowledge into a step-by-step masterclass with video lessons for artisans.'}
                </p>
                <button
                  className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                    setCourseFormOpen(true)
                  }}
                  type="button"
                >
                  Create your first course
                </button>
              </div>
            )
          )}
        </section>

        {/* Video Preview Modal */}
        {activePreview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
          >
            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-surface p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-text-main">
                  {activePreview.title}
                </h3>
                <button
                  className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-main"
                  onClick={() => setActivePreview(null)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl bg-black">
                <CourseVideo title={activePreview.title} url={activePreview.url} />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                  onClick={() => setActivePreview(null)}
                  type="button"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lesson Modal */}
        {newLessonModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
          >
            <form
              className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
              onSubmit={handleAddLessonSubmit}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-text-main">
                  Add Video Lesson
                </h3>
                <button
                  className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-main"
                  onClick={() => setNewLessonModal(null)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Attach an instructional YouTube, Vimeo, or direct MP4/WebM video.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-text-main">
                  Lesson Title
                  <input
                    className={fieldClass}
                    maxLength={100}
                    onChange={(e) =>
                      setNewLessonModal((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Setting up the warp"
                    required
                    value={newLessonModal.title}
                  />
                </label>
                <label className="block text-sm font-medium text-text-main">
                  Video URL
                  <input
                    className={fieldClass}
                    onChange={(e) =>
                      setNewLessonModal((prev) => ({
                        ...prev,
                        videoUrl: e.target.value,
                      }))
                    }
                    placeholder="https://youtu.be/... or Vimeo"
                    required
                    type="url"
                    value={newLessonModal.videoUrl}
                  />
                </label>
                <label className="block text-sm font-medium text-text-main">
                  Duration <span className="font-normal text-text-muted">(optional)</span>
                  <input
                    className={fieldClass}
                    maxLength={30}
                    onChange={(e) =>
                      setNewLessonModal((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="e.g. 15 min"
                    value={newLessonModal.duration}
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-background"
                  onClick={() => setNewLessonModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                  disabled={isAddingLesson}
                  type="submit"
                >
                  {isAddingLesson ? 'Adding...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </ExpertLayout>
  )
}

export default ExpertDashboardPage
