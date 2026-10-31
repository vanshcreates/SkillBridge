import { getCourseVideoSource } from './course-video'

const EXPERT_COURSES_KEY = 'skillbridge-expert-courses'

function readExpertCourses() {
  const savedCourses = window.localStorage.getItem(EXPERT_COURSES_KEY)
  if (!savedCourses) return []

  try {
    const courses = JSON.parse(savedCourses)
    if (!Array.isArray(courses)) {
      throw new Error('Saved course data has an invalid format.')
    }
    return courses
  } catch (error) {
    console.error('Published course data in browser storage is invalid.', error)
    throw new Error('Courses could not be read. Clear the app storage and try again.')
  }
}

export function getExpertCourses() {
  return readExpertCourses().sort(
    (first, second) => second.createdAt.localeCompare(first.createdAt),
  )
}

export function saveExpertCourse(expert, courseDetails) {
  const courses = readExpertCourses()
  const course = {
    id: `course-${Date.now()}`,
    expertId: expert.id,
    title: courseDetails.title.trim(),
    category: courseDetails.category.trim(),
    description: courseDetails.description.trim(),
    duration: courseDetails.duration.trim(),
    level: courseDetails.level.trim(),
    lessons: courseDetails.lessons.map((lesson) => ({
      title: lesson.title.trim(),
      videoUrl: lesson.videoUrl.trim(),
    })),
    outcomes: courseDetails.outcomes
      .split(/\r?\n/)
      .map((outcome) => outcome.trim())
      .filter(Boolean),
    instructor: expert.name,
    expertise: expert.expertise,
    createdAt: new Date().toISOString(),
    iconName: 'BookOpenCheck',
  }

  if (!course.lessons.length || course.lessons.some((lesson) => !lesson.title)) {
    throw new Error('Add a title for each course lesson.')
  }
  if (course.lessons.some((lesson) => !getCourseVideoSource(lesson.videoUrl))) {
    throw new Error(
      'Add a valid YouTube, Vimeo, or direct video URL for each lesson.',
    )
  }

  try {
    window.localStorage.setItem(
      EXPERT_COURSES_KEY,
      JSON.stringify([...courses, course]),
    )
  } catch (error) {
    console.error('Unable to publish expert course.', error)
    throw new Error('Your course could not be saved in this browser.')
  }

  return course
}
