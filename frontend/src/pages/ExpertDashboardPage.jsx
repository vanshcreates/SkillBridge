import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Award,
  BookOpenCheck,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import ExpertLayout from '../components/layout/ExpertLayout'
import CourseVideo from '../components/training/CourseVideo'
import ExpertEvaluationStudio from '../components/expert/ExpertEvaluationStudio'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  getExpertDashboardApi,
  getExpertCoursesApi,
  createExpertCourseApi,
  updateExpertCourseApi,
  toggleCoursePublishApi,
  deleteExpertCourseApi,
  addCourseLessonApi,
  deleteCourseLessonApi,
  uploadCourseVideoApi,
} from '../services/expert-api'
import {
  calculateTotalCourseDuration,
  formatDuration,
  getVideoDuration,
  parseDurationToSeconds,
} from '../utils/course-video'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const LESSONS_PER_PAGE = 3

const ExpertDashboardPage = () => {
  const { currentUser, authenticate } = useAuthDialog()
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('evaluations')
  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState(null)

  // Controlled form states
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formLevel, setFormLevel] = useState('Beginner')
  const [formDescription, setFormDescription] = useState('')
  const [formOutcomes, setFormOutcomes] = useState('')
  const [courseDuration, setCourseDuration] = useState('')

  const [lessonDrafts, setLessonDrafts] = useState([
    {
      id: 1,
      title: '',
      videoUrl: '',
      fileName: '',
      isUploading: false,
      uploadError: '',
      useUrlInput: false,
      duration: '',
      durationSeconds: 0,
    },
  ])
  const nextLessonId = useRef(2)
  const formRef = useRef(null)

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

  // Add lesson modal state
  const [newLessonModal, setNewLessonModal] = useState(null)
  const [isAddingLesson, setIsAddingLesson] = useState(false)

  // Reset form to default blank creation state
  const resetForm = () => {
    setEditingCourseId(null)
    setFormTitle('')
    setFormCategory('')
    setFormLevel('Beginner')
    setFormDescription('')
    setFormOutcomes('')
    setCourseDuration('')
    setLessonDrafts([
      {
        id: 1,
        title: '',
        videoUrl: '',
        fileName: '',
        isUploading: false,
        uploadError: '',
        useUrlInput: false,
        duration: '',
        durationSeconds: 0,
      },
    ])
    nextLessonId.current = 2
  }

  // 1. Fetch dashboard data & courses from backend
  const loadDashboardData = useCallback(async (targetPage = 1) => {
    setIsLoading(true)
    try {
      // Fetch live metrics
      const dashboardRes = await getExpertDashboardApi().catch(() => null)
      if (dashboardRes?.success && dashboardRes.stats) {
        setStats(dashboardRes.stats)
      }

      // Fetch live paginated courses
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
        setCourses([])
      }
    } catch (err) {
      console.warn('Dashboard loading error:', err)
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    if (currentUser?.accountType === 'expert') {
      loadDashboardData(1)
    }
  }, [currentUser, loadDashboardData])

  if (!currentUser) {
    return <Navigate replace to="/expert/auth" />
  }
  if (currentUser.accountType !== 'expert') {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  // Start editing an existing course
  const handleStartEditCourse = (course) => {
    setNotice('')
    setNoticeIsError(false)
    setEditingCourseId(course.id || course._id)
    setFormTitle(course.title || '')
    setFormCategory(course.category || '')
    setFormLevel(course.level || 'Beginner')
    setFormDescription(course.description || '')
    setFormOutcomes(
      Array.isArray(course.outcomes)
        ? course.outcomes.join('\n')
        : course.outcomes || ''
    )

    const existingLessons = (course.lessons || []).map((l, idx) => {
      const title = typeof l === 'string' ? l : l.title || ''
      const videoUrl = typeof l === 'string' ? '' : l.videoUrl || ''
      const duration = typeof l === 'string' ? '' : l.duration || ''
      const durationSeconds = parseDurationToSeconds(duration)
      return {
        id: l.id || l._id || idx + 1,
        title,
        videoUrl,
        fileName: '',
        isUploading: false,
        uploadError: '',
        useUrlInput: Boolean(videoUrl && !videoUrl.includes('cloudinary')),
        duration,
        durationSeconds,
      }
    })

    const initialDrafts =
      existingLessons.length > 0
        ? existingLessons
        : [
            {
              id: 1,
              title: '',
              videoUrl: '',
              fileName: '',
              isUploading: false,
              uploadError: '',
              useUrlInput: false,
              duration: '',
              durationSeconds: 0,
            },
          ]

    setLessonDrafts(initialDrafts)
    nextLessonId.current = initialDrafts.length + 1

    // Automatically calculate total course duration as the sum of all lesson video times
    const computedTotal = calculateTotalCourseDuration(initialDrafts)
    setCourseDuration(computedTotal || course.duration || '0 sec')

    setCourseFormOpen(true)

    // Smooth scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  // Handle uploading video file for a specific lesson draft and update duration
  const handleLessonFileChange = async (lessonId, file) => {
    if (!file) return

    const localPreviewUrl = URL.createObjectURL(file)

    // Calculate duration immediately in the browser
    let calculatedSecs = 0
    let formattedDurationStr = ''
    try {
      calculatedSecs = await getVideoDuration(file)
      formattedDurationStr = formatDuration(calculatedSecs)
    } catch (err) {
      console.warn('Could not read video duration in browser:', err)
    }

    setLessonDrafts((drafts) => {
      const updated = drafts.map((entry) =>
        entry.id === lessonId
          ? {
              ...entry,
              fileName: file.name,
              videoUrl: localPreviewUrl,
              duration: formattedDurationStr || entry.duration,
              durationSeconds: calculatedSecs,
              isUploading: true,
              uploadError: '',
            }
          : entry
      )

      // Total course duration is equal to the sum of all videos
      const totalCourseTime = calculateTotalCourseDuration(updated)
      setCourseDuration(totalCourseTime || '0 sec')

      return updated
    })

    try {
      const uploadRes = await uploadCourseVideoApi(file)
      if (uploadRes?.url) {
        setLessonDrafts((drafts) => {
          const updated = drafts.map((entry) =>
            entry.id === lessonId
              ? {
                  ...entry,
                  videoUrl: uploadRes.url,
                  fileName: file.name,
                  isUploading: false,
                  duration: uploadRes.duration || formattedDurationStr || entry.duration,
                  durationSeconds: uploadRes.durationSeconds || calculatedSecs,
                }
              : entry
          )
          const totalCourseTime = calculateTotalCourseDuration(updated)
          setCourseDuration(totalCourseTime || '0 sec')
          return updated
        })
      }
    } catch (err) {
      console.error('Video upload failed:', err)
      setLessonDrafts((drafts) =>
        drafts.map((entry) =>
          entry.id === lessonId
            ? {
                ...entry,
                isUploading: false,
                uploadError: err.message || 'Failed to upload video.',
              }
            : entry
        )
      )
    }
  }

  // Handle removing a lesson and recalculating total course duration
  const handleRemoveLesson = (lessonId) => {
    setLessonDrafts((drafts) => {
      const updated = drafts.filter((entry) => entry.id !== lessonId)
      const totalCourseTime = calculateTotalCourseDuration(updated)
      setCourseDuration(totalCourseTime || '0 sec')
      return updated
    })
  }

  // Handle uploading video file in the Add Lesson modal and calculate duration
  const handleModalFileChange = async (file) => {
    if (!file) return

    const localPreviewUrl = URL.createObjectURL(file)

    let calculatedSecs = 0
    let formattedDurationStr = ''
    try {
      calculatedSecs = await getVideoDuration(file)
      formattedDurationStr = formatDuration(calculatedSecs)
    } catch (err) {
      console.warn('Could not read video duration in browser:', err)
    }

    setNewLessonModal((prev) => ({
      ...prev,
      fileName: file.name,
      videoUrl: localPreviewUrl,
      duration: formattedDurationStr || prev.duration,
      durationSeconds: calculatedSecs,
      isUploading: true,
      uploadError: '',
    }))

    try {
      const uploadRes = await uploadCourseVideoApi(file)
      if (uploadRes?.url) {
        setNewLessonModal((prev) => ({
          ...prev,
          videoUrl: uploadRes.url,
          isUploading: false,
          duration: uploadRes.duration || formattedDurationStr || prev.duration,
          durationSeconds: uploadRes.durationSeconds || calculatedSecs,
        }))
      }
    } catch (err) {
      setNewLessonModal((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: err.message || 'Failed to upload video.',
      }))
    }
  }

  // 2. Publish new course or Update existing course
  const handleSaveCourse = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)

    // Check if any video is currently uploading
    if (lessonDrafts.some((l) => l.isUploading)) {
      setNotice('Please wait for video upload to complete before saving.')
      setNoticeIsError(true)
      return
    }

    const validLessons = lessonDrafts
      .filter((l) => l.title.trim())
      .map((l) => ({
        title: l.title.trim(),
        videoUrl: (l.videoUrl || '').trim(),
        duration: (l.duration || '').trim(),
      }))

    if (!validLessons.length) {
      setNotice('Please provide at least one lesson title.')
      setNoticeIsError(true)
      return
    }

    // Exact course duration calculated from the total time of all videos
    const totalTime =
      calculateTotalCourseDuration(validLessons) || courseDuration || 'Flexible'

    setIsSubmitting(true)

    try {
      if (editingCourseId) {
        // UPDATE existing course
        const response = await updateExpertCourseApi(editingCourseId, {
          title: formTitle.trim(),
          category: formCategory.trim(),
          description: formDescription.trim(),
          duration: totalTime,
          level: formLevel,
          lessons: validLessons,
          outcomes: formOutcomes,
        })

        if (response?.success && response.course) {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === editingCourseId || c._id === editingCourseId
                ? response.course
                : c
            )
          )
          setNotice(`"${formTitle.trim()}" updated successfully with duration ${totalTime}.`)
        } else {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === editingCourseId || c._id === editingCourseId
                ? {
                    ...c,
                    title: formTitle.trim(),
                    category: formCategory.trim(),
                    description: formDescription.trim(),
                    duration: totalTime,
                    level: formLevel,
                    lessons: validLessons,
                    outcomes: formOutcomes.split(/\r?\n/).filter(Boolean),
                  }
                : c
            )
          )
          setNotice('Course updated in workspace.')
        }
      } else {
        // CREATE new course
        const response = await createExpertCourseApi({
          title: formTitle.trim(),
          category: formCategory.trim(),
          description: formDescription.trim(),
          duration: totalTime,
          level: formLevel,
          lessons: validLessons,
          outcomes: formOutcomes,
        })

        if (response?.success && response.course) {
          setCourses((prev) => [response.course, ...prev])
          setStats((prev) => ({
            ...prev,
            totalCourses: prev.totalCourses + 1,
            publishedCourses: prev.publishedCourses + 1,
            totalLessons: prev.totalLessons + validLessons.length,
          }))
          setNotice(`Your course has been published with total duration ${totalTime}.`)
        } else {
          throw new Error(response?.message || 'Unable to save course to cloud.')
        }
      }

      setCourseFormOpen(false)
      resetForm()
    } catch (error) {
      console.error('Save course error:', error)
      setNotice(error.message || 'Unable to save course. Please try again.')
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
        if (editingCourseId === courseId) {
          setCourseFormOpen(false)
          resetForm()
        }
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

    if (newLessonModal.isUploading) {
      setNotice('Please wait for the video upload to finish.')
      setNoticeIsError(true)
      return
    }

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
        setNotice(
          `New video lesson added. Course total duration updated to ${res.course.duration}.`
        )
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
        setNotice(
          `Lesson "${lessonTitle}" removed. Course total duration updated to ${res.course.duration}.`
        )
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
                  Create practical masterclasses and upload video lessons to empower artisans.
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
                if (courseFormOpen && !editingCourseId) {
                  setCourseFormOpen(false)
                } else {
                  resetForm()
                  setCourseFormOpen(true)
                }
              }}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {courseFormOpen && !editingCourseId ? 'Close form' : 'Add a course'}
            </button>
          </div>
        </section>

        {/* Workspace Navigation Tabs */}
        <nav
          aria-label="Expert workspace navigation"
          className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface p-1.5 shadow-card"
        >
          <div className="flex gap-2">
            <button
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition cursor-pointer ${
                activeWorkspaceTab === 'evaluations'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:bg-background hover:text-primary'
              }`}
              onClick={() => setActiveWorkspaceTab('evaluations')}
              type="button"
            >
              <Award className="h-4 w-4 text-secondary" />
              Product Evaluations & Rankings
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition cursor-pointer ${
                activeWorkspaceTab === 'courses'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:bg-background hover:text-primary'
              }`}
              onClick={() => setActiveWorkspaceTab('courses')}
              type="button"
            >
              <GraduationCap className="h-4 w-4" />
              Courses & Masterclasses
            </button>
          </div>
        </nav>

        {/* Tab 1: Product Evaluations */}
        {activeWorkspaceTab === 'evaluations' && (
          <div className="mt-6">
            <ExpertEvaluationStudio
              currentUser={currentUser}
              onUserUpdated={authenticate}
            />
          </div>
        )}

        {/* Tab 2: Courses & Masterclasses */}
        {activeWorkspaceTab === 'courses' && (
          <div>
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

        {/* Course Form (Supports Create and Edit) */}
        {courseFormOpen && (
          <section
            className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8"
            ref={formRef}
          >
            <form
              className="grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-2 sm:p-6"
              onSubmit={handleSaveCourse}
            >
              <div className="sm:col-span-2 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-main">
                    {editingCourseId ? 'Edit Course' : 'Create a Course'}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    {editingCourseId
                      ? 'Update course information, videos, and modules.'
                      : 'Add a structured outline and upload videos so artisans can learn step-by-step.'}
                  </p>
                </div>
                {editingCourseId && (
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                    Editing Mode
                  </span>
                )}
              </div>

              <label className="text-sm font-medium text-text-main">
                Course title
                <input
                  className={fieldClass}
                  maxLength={100}
                  name="title"
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Natural dyeing with local plants"
                  required
                  value={formTitle}
                />
              </label>

              <label className="text-sm font-medium text-text-main">
                Craft or topic
                <input
                  className={fieldClass}
                  maxLength={60}
                  name="category"
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Textile arts"
                  required
                  value={formCategory}
                />
              </label>

              {/* COURSE DURATION: AUTO-CALCULATED AS TOTAL TIME OF ALL VIDEOS */}
              <label className="text-sm font-medium text-text-main">
                <div className="flex items-center justify-between">
                  <span>Course Duration</span>
                  <span className="text-xs font-semibold text-secondary">
                    Auto-calculated from all videos
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    className={`${fieldClass} pr-24 font-medium bg-surface/60`}
                    name="duration"
                    readOnly
                    placeholder="Upload videos to calculate total duration"
                    value={courseDuration || '0 sec'}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-text-muted">
                    <Clock3 className="h-3.5 w-3.5 text-secondary" />
                    <span>Total time</span>
                  </div>
                </div>
                <p className="mt-1 text-[0.72rem] text-text-secondary">
                  Automatically calculated as the exact sum of all lesson video times.
                </p>
              </label>

              <label className="text-sm font-medium text-text-main">
                Learner level
                <select
                  className={fieldClass}
                  name="level"
                  onChange={(e) => setFormLevel(e.target.value)}
                  value={formLevel}
                >
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
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What does this course teach, and who is it for?"
                  required
                  rows="3"
                  value={formDescription}
                />
              </label>

              {/* Video Lessons Section */}
              <fieldset className="grid gap-4 sm:col-span-2">
                <legend className="font-semibold text-text-main">
                  Course video lessons
                </legend>
                <p className="-mt-2 text-sm leading-6 text-text-secondary">
                  Add each lesson with a title and upload a video file. Course duration sums the time of all videos automatically.
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
                          onClick={() => handleRemoveLesson(lesson.id)}
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

                    {/* VIDEO UPLOAD FIELD WITH AUTOMATIC DURATION */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-main">Video</span>
                        <button
                          className="text-xs font-semibold text-secondary hover:underline"
                          onClick={() =>
                            setLessonDrafts((drafts) =>
                              drafts.map((entry) =>
                                entry.id === lesson.id
                                  ? { ...entry, useUrlInput: !entry.useUrlInput }
                                  : entry
                              )
                            )
                          }
                          type="button"
                        >
                          {lesson.useUrlInput ? 'Upload file instead' : 'Or write URL'}
                        </button>
                      </div>

                      {lesson.useUrlInput ? (
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
                          placeholder="https://youtu.be/... or video link"
                          type="url"
                          value={lesson.videoUrl}
                        />
                      ) : (
                        <div className="rounded-lg border border-border bg-surface p-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover">
                              <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                              <span>Select file</span>
                              <input
                                accept="video/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLessonFileChange(lesson.id, file)
                                }}
                                type="file"
                              />
                            </label>

                            {lesson.fileName ? (
                              <span className="max-w-[12rem] truncate text-xs font-medium text-text-main">
                                {lesson.fileName}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">
                                {lesson.videoUrl ? 'Video attached' : 'No video chosen (MP4, WebM, MOV)'}
                              </span>
                            )}

                            {lesson.isUploading && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                                Uploading...
                              </span>
                            )}

                            {lesson.videoUrl && !lesson.isUploading && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                                <CheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
                                Ready
                              </span>
                            )}
                          </div>

                          {/* Calculated Duration Display */}
                          {lesson.duration && (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-text-secondary">
                              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-secondary" />
                              <span>
                                Video length: <strong className="text-text-main">{lesson.duration}</strong>
                              </span>
                            </div>
                          )}

                          {lesson.uploadError && (
                            <p className="mt-1.5 text-xs text-error">{lesson.uploadError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="min-h-10 w-fit rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  onClick={() => {
                    const id = nextLessonId.current
                    nextLessonId.current += 1
                    setLessonDrafts((drafts) => [
                      ...drafts,
                      {
                        id,
                        title: '',
                        videoUrl: '',
                        fileName: '',
                        isUploading: false,
                        uploadError: '',
                        useUrlInput: false,
                        duration: '',
                        durationSeconds: 0,
                      },
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
                  onChange={(e) => setFormOutcomes(e.target.value)}
                  placeholder={'Choose the right materials\nPractice the core technique\nBuild your first motif'}
                  rows="3"
                  value={formOutcomes}
                />
              </label>

              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  className="min-h-11 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCourseId
                      ? 'Save Changes'
                      : 'Publish Course'}
                </button>
                <button
                  className="min-h-11 rounded-lg border border-border px-5 py-2.5 font-semibold text-text-secondary hover:bg-surface"
                  onClick={() => {
                    setCourseFormOpen(false)
                    resetForm()
                  }}
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
                      {/* Course Header with Edit, Status, and Delete */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                          <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
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

                          {/* EDIT COURSE BUTTON */}
                          <button
                            aria-label={`Edit course ${course.title}`}
                            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-primary transition"
                            onClick={() => handleStartEditCourse(course)}
                            title="Edit course details & modules"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>

                          {/* DELETE COURSE BUTTON */}
                          <button
                            aria-label={`Delete course ${course.title}`}
                            className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-error transition"
                            onClick={() => handleDeleteCourse(courseId, course.title)}
                            title="Delete this course"
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

                      {/* Course Metadata: Total duration equal to sum of all videos */}
                      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-text-muted">
                        <span
                          className="inline-flex items-center gap-1 font-medium text-text-main"
                          title="Total duration of all lesson videos"
                        >
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-secondary" />
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
                                fileName: '',
                                isUploading: false,
                                uploadError: '',
                                useUrlInput: false,
                                duration: '',
                                durationSeconds: 0,
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
                            No lessons added yet. Click &quot;Add lesson&quot; to upload video guides.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {currentLessonsSlice.map((lesson, idx) => {
                              const lessonId = lesson.id || lesson._id || `idx-${startIdx + idx}`
                              const lessonTitle =
                                typeof lesson === 'string' ? lesson : lesson.title
                              const hasVideo =
                                typeof lesson !== 'string' && Boolean(lesson.videoUrl)
                              const lessonDuration =
                                typeof lesson !== 'string' ? lesson.duration : ''

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
                                    {lessonDuration && (
                                      <span className="ml-1.5 text-[0.68rem] text-text-muted">
                                        ({lessonDuration})
                                      </span>
                                    )}
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
                    resetForm()
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

                  </div>
        )}

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
                Upload a video file from your computer. Duration will be calculated automatically.
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

                {/* MODAL VIDEO UPLOAD FIELD */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-main">Video</span>
                    <button
                      className="text-xs font-semibold text-secondary hover:underline"
                      onClick={() =>
                        setNewLessonModal((prev) => ({
                          ...prev,
                          useUrlInput: !prev.useUrlInput,
                        }))
                      }
                      type="button"
                    >
                      {newLessonModal.useUrlInput ? 'Upload file instead' : 'Or write URL'}
                    </button>
                  </div>

                  {newLessonModal.useUrlInput ? (
                    <input
                      className={fieldClass}
                      onChange={(e) =>
                        setNewLessonModal((prev) => ({
                          ...prev,
                          videoUrl: e.target.value,
                        }))
                      }
                      placeholder="https://youtu.be/... or video link"
                      type="url"
                      value={newLessonModal.videoUrl}
                    />
                  ) : (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover">
                          <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                          <span>Select file</span>
                          <input
                            accept="video/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleModalFileChange(file)
                            }}
                            type="file"
                          />
                        </label>

                        {newLessonModal.fileName ? (
                          <span className="max-w-[12rem] truncate text-xs font-medium text-text-main">
                            {newLessonModal.fileName}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            {newLessonModal.videoUrl ? 'Video attached' : 'No video chosen (MP4, WebM, MOV)'}
                          </span>
                        )}

                        {newLessonModal.isUploading && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                            Uploading...
                          </span>
                        )}

                        {newLessonModal.videoUrl && !newLessonModal.isUploading && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
                            Ready
                          </span>
                        )}
                      </div>

                      {newLessonModal.uploadError && (
                        <p className="mt-1.5 text-xs text-error">{newLessonModal.uploadError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* AUTOMATIC DURATION FIELD IN MODAL */}
                <label className="block text-sm font-medium text-text-main">
                  <div className="flex items-center justify-between">
                    <span>Duration</span>
                    {newLessonModal.duration && (
                      <span className="text-xs font-normal text-secondary">
                        Auto-calculated from video
                      </span>
                    )}
                  </div>
                  <input
                    className={fieldClass}
                    maxLength={30}
                    onChange={(e) =>
                      setNewLessonModal((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="e.g. 15 min (or auto-calculated on upload)"
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
                  disabled={isAddingLesson || newLessonModal.isUploading}
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
