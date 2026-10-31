import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ==========================================
// 1. EXPERT DASHBOARD METRICS
// ==========================================

export const getExpertDashboard = async (req, res) => {
  try {
    const expertId = req.user._id;

    const [courses, totalLearners] = await Promise.all([
      Course.find({ expert: expertId }).sort({ createdAt: -1 }),
      User.countDocuments({ accountType: "artisan" }),
    ]);

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = totalCourses - publishedCourses;
    const totalLessons = courses.reduce(
      (sum, c) => sum + (c.lessons ? c.lessons.length : 0),
      0
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalLessons,
        totalLearners,
      },
      recentCourses: courses.slice(0, 5).map((c) => c.toSafeObject()),
    });
  } catch (error) {
    console.error("Get expert dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load expert dashboard data.",
    });
  }
};

// ==========================================
// 2. COURSES MANAGEMENT & PAGINATION
// ==========================================

export const getExpertCourses = async (req, res) => {
  try {
    const expertId = req.user._id;
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
    } = req.query;

    const query = { expert: expertId };

    if (category && category !== "All" && category !== "All courses") {
      query.category = category;
    }

    if (status === "published") {
      query.isPublished = true;
    } else if (status === "draft") {
      query.isPublished = false;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, courses] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      courses: courses.map((course) => course.toSafeObject()),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    console.error("Get expert courses error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve courses.",
    });
  }
};

export const getExpertCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Get expert course by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve course details.",
    });
  }
};

export const createExpertCourse = async (req, res) => {
  try {
    const expert = req.user;
    const {
      title,
      category,
      description,
      duration,
      level,
      lessons,
      outcomes,
    } = req.body;

    if (!title?.trim() || !category?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title, craft category, and description are required.",
      });
    }

    let parsedLessons = [];
    if (typeof lessons === "string") {
      try {
        parsedLessons = JSON.parse(lessons);
      } catch {
        parsedLessons = [];
      }
    } else if (Array.isArray(lessons)) {
      parsedLessons = lessons;
    }

    // Sanitize lessons
    const sanitizedLessons = parsedLessons
      .filter((lesson) => lesson && typeof lesson.title === "string" && lesson.title.trim())
      .map((lesson) => ({
        title: lesson.title.trim(),
        videoUrl: (lesson.videoUrl || "").trim(),
        duration: (lesson.duration || "").trim(),
        description: (lesson.description || "").trim(),
      }));

    if (sanitizedLessons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid lesson with a title.",
      });
    }

    let parsedOutcomes = [];
    if (typeof outcomes === "string") {
      parsedOutcomes = outcomes
        .split(/\r?\n/)
        .map((o) => o.trim())
        .filter(Boolean);
    } else if (Array.isArray(outcomes)) {
      parsedOutcomes = outcomes.map((o) => String(o).trim()).filter(Boolean);
    }

    let thumbnailUrl = req.body.thumbnail?.trim() || "";
    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url) {
        thumbnailUrl = uploadRes.secure_url;
      }
    }

    const validLevels = ["Beginner", "Intermediate", "Advanced", "All levels"];
    const sanitizedLevel = validLevels.includes(level) ? level : "Beginner";

    const course = await Course.create({
      expert: expert._id,
      instructor: expert.name,
      expertise: expert.expertise || "",
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      duration: duration?.trim() || "4 weeks",
      level: sanitizedLevel,
      thumbnail: thumbnailUrl,
      iconName: req.body.iconName || "GraduationCap",
      lessons: sanitizedLessons,
      outcomes: parsedOutcomes,
      isPublished: true,
    });

    return res.status(201).json({
      success: true,
      message: "Your course has been published to the training library.",
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Create expert course error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish course.",
    });
  }
};

export const updateExpertCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    const {
      title,
      category,
      description,
      duration,
      level,
      lessons,
      outcomes,
      isPublished,
    } = req.body;

    if (title?.trim()) course.title = title.trim();
    if (category?.trim()) course.category = category.trim();
    if (description?.trim()) course.description = description.trim();
    if (duration?.trim()) course.duration = duration.trim();
    if (level) {
      const validLevels = ["Beginner", "Intermediate", "Advanced", "All levels"];
      if (validLevels.includes(level)) course.level = level;
    }
    if (isPublished !== undefined) {
      course.isPublished = Boolean(isPublished);
    }

    if (lessons !== undefined) {
      let parsedLessons = [];
      if (typeof lessons === "string") {
        try {
          parsedLessons = JSON.parse(lessons);
        } catch {
          parsedLessons = [];
        }
      } else if (Array.isArray(lessons)) {
        parsedLessons = lessons;
      }
      if (parsedLessons.length > 0) {
        course.lessons = parsedLessons.map((l) => ({
          title: (l.title || "").trim(),
          videoUrl: (l.videoUrl || "").trim(),
          duration: (l.duration || "").trim(),
          description: (l.description || "").trim(),
        }));
      }
    }

    if (outcomes !== undefined) {
      if (typeof outcomes === "string") {
        course.outcomes = outcomes
          .split(/\r?\n/)
          .map((o) => o.trim())
          .filter(Boolean);
      } else if (Array.isArray(outcomes)) {
        course.outcomes = outcomes.map((o) => String(o).trim()).filter(Boolean);
      }
    }

    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url) {
        course.thumbnail = uploadRes.secure_url;
      }
    } else if (req.body.thumbnail) {
      course.thumbnail = req.body.thumbnail.trim();
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Update expert course error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update course.",
    });
  }
};

export const toggleCoursePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    course.isPublished =
      req.body.isPublished !== undefined
        ? Boolean(req.body.isPublished)
        : !course.isPublished;

    await course.save();

    return res.status(200).json({
      success: true,
      message: course.isPublished
        ? "Course published to artisan training library."
        : "Course converted to draft.",
      isPublished: course.isPublished,
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Toggle course publish error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update publish state.",
    });
  }
};

export const deleteExpertCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndDelete({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully.",
    });
  } catch (error) {
    console.error("Delete expert course error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete course.",
    });
  }
};

// ==========================================
// 3. VIDEO LESSONS (WITH PAGINATION)
// ==========================================

export const getCourseLessons = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const allLessons = course.lessons || [];
    const total = allLessons.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedSlice = allLessons.slice(startIndex, startIndex + limitNum);

    const formattedLessons = paginatedSlice.map((lesson, index) => ({
      id: lesson._id ? lesson._id.toString() : `lesson-${startIndex + index + 1}`,
      _id: lesson._id ? lesson._id.toString() : undefined,
      sequence: startIndex + index + 1,
      title: lesson.title,
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || "",
      description: lesson.description || "",
    }));

    return res.status(200).json({
      success: true,
      courseId: course._id.toString(),
      courseTitle: course.title,
      lessons: formattedLessons,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasNext: startIndex + limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get course lessons error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve lessons.",
    });
  }
};

export const addCourseLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    const { title, videoUrl, duration, description } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required.",
      });
    }

    course.lessons.push({
      title: title.trim(),
      videoUrl: (videoUrl || "").trim(),
      duration: (duration || "").trim(),
      description: (description || "").trim(),
    });

    await course.save();

    return res.status(201).json({
      success: true,
      message: "Lesson added successfully.",
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Add course lesson error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add lesson.",
    });
  }
};

export const updateCourseLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    // Match by MongoDB _id or by array index
    let lesson = course.lessons.id(lessonId);
    if (!lesson) {
      const idx = parseInt(lessonId, 10);
      if (!isNaN(idx) && idx >= 0 && idx < course.lessons.length) {
        lesson = course.lessons[idx];
      }
    }

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course.",
      });
    }

    const { title, videoUrl, duration, description } = req.body;
    if (title?.trim()) lesson.title = title.trim();
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl.trim();
    if (duration !== undefined) lesson.duration = duration.trim();
    if (description !== undefined) lesson.description = description.trim();

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully.",
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Update course lesson error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update lesson.",
    });
  }
};

export const deleteCourseLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const course = await Course.findOne({
      _id: id,
      expert: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or access denied.",
      });
    }

    const initialLength = course.lessons.length;
    course.lessons = course.lessons.filter(
      (l, idx) => l._id?.toString() !== lessonId && String(idx) !== lessonId
    );

    if (course.lessons.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found to delete.",
      });
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully.",
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Delete course lesson error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete lesson.",
    });
  }
};

// ==========================================
// 4. EXPERT PROFILE
// ==========================================

export const getExpertProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Get expert profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load expert profile.",
    });
  }
};

export const updateExpertProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, expertise, bio, city, state } = req.body;

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (expertise !== undefined) user.expertise = expertise.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();

    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url) {
        user.avatar = uploadRes.secure_url;
      }
    }

    await user.save();

    // Synchronize instructor display name and expertise on expert's courses
    await Course.updateMany(
      { expert: user._id },
      { instructor: user.name, expertise: user.expertise || "" }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Update expert profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

