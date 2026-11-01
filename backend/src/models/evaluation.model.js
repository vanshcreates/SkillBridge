import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Artisan reference is required"],
      index: true,
    },
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Expert reference is required"],
      index: true,
    },
    // 5 Professional Criteria (1 to 10 each)
    productQuality: {
      type: Number,
      required: [true, "Product Quality rating (1-10) is required"],
      min: [1, "Minimum rating is 1"],
      max: [10, "Maximum rating is 10"],
    },
    creativityOriginality: {
      type: Number,
      required: [true, "Creativity & Originality rating (1-10) is required"],
      min: [1, "Minimum rating is 1"],
      max: [10, "Maximum rating is 10"],
    },
    craftsmanship: {
      type: Number,
      required: [true, "Craftsmanship rating (1-10) is required"],
      min: [1, "Minimum rating is 1"],
      max: [10, "Maximum rating is 10"],
    },
    designFinishing: {
      type: Number,
      required: [true, "Design & Finishing rating (1-10) is required"],
      min: [1, "Minimum rating is 1"],
      max: [10, "Maximum rating is 10"],
    },
    marketPotential: {
      type: Number,
      required: [true, "Market Potential rating (1-10) is required"],
      min: [1, "Minimum rating is 1"],
      max: [10, "Maximum rating is 10"],
    },
    // Average of the 5 criteria for this evaluation
    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    feedback: {
      type: String,
      required: [true, "Written expert feedback is required"],
      trim: true,
    },
    suggestions: {
      type: String,
      trim: true,
      default: "",
    },
    recommendedPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    status: {
      type: String,
      enum: ["Evaluated", "Rejected"],
      default: "Evaluated",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate overallScore before validation if not already provided
evaluationSchema.pre("validate", function () {
  if (
    this.productQuality != null &&
    this.creativityOriginality != null &&
    this.craftsmanship != null &&
    this.designFinishing != null &&
    this.marketPotential != null
  ) {
    const total =
      Number(this.productQuality) +
      Number(this.creativityOriginality) +
      Number(this.craftsmanship) +
      Number(this.designFinishing) +
      Number(this.marketPotential);
    this.overallScore = Math.round((total / 5) * 10) / 10;
  }
});

evaluationSchema.methods.toSafeObject = function (expertInfo = null) {
  const expertData = expertInfo || (this.expert && typeof this.expert === "object" ? this.expert : null);
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    productId: this.product?._id ? this.product._id.toString() : this.product?.toString(),
    artisanId: this.artisan?._id ? this.artisan._id.toString() : this.artisan?.toString(),
    expertId: expertData?._id
      ? expertData._id.toString()
      : this.expert?._id
      ? this.expert._id.toString()
      : this.expert?.toString(),
    expertName: expertData?.name || "Verified Craft Expert",
    expertAvatar: expertData?.avatar || "",
    expertTitle: expertData?.expertise || "Master Evaluator",
    productQuality: this.productQuality,
    creativityOriginality: this.creativityOriginality,
    craftsmanship: this.craftsmanship,
    designFinishing: this.designFinishing,
    marketPotential: this.marketPotential,
    overallScore: this.overallScore,
    feedback: this.feedback,
    suggestions: this.suggestions || "",
    recommendedPrice: this.recommendedPrice,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Evaluation = mongoose.model("Evaluation", evaluationSchema);

