import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Course category is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
    },
    duration: {
      type: String,
      default: "4 weeks",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    instructor: {
      type: String,
      required: true,
      trim: true,
    },
    expertise: {
      type: String,
      trim: true,
      default: "",
    },
    iconName: {
      type: String,
      default: "GraduationCap",
    },
    lessons: [lessonSchema],
    outcomes: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    expertId: this.expert ? this.expert.toString() : null,
    title: this.title,
    category: this.category,
    description: this.description,
    duration: this.duration,
    level: this.level,
    instructor: this.instructor,
    expertise: this.expertise || "",
    iconName: this.iconName || "GraduationCap",
    lessons: this.lessons || [],
    outcomes: this.outcomes || [],
    isPublished: this.isPublished,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Course = mongoose.model("Course", courseSchema);

