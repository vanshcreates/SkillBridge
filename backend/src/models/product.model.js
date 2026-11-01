import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      default: 1,
      min: [0, "Stock cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Cost-based pricing guide
    materialCost: {
      type: Number,
      default: 0,
    },
    laborHours: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    packagingCost: {
      type: Number,
      default: 0,
    },
    // Product story & craftsmanship
    story: {
      type: String,
      trim: true,
      default: "",
    },
    craftTime: {
      type: String,
      trim: true,
      default: "",
    },
    materials: [
      {
        type: String,
        trim: true,
      },
    ],
    dimensions: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // Women Artisan Evaluation & Ranking System
    // ==========================================
    evaluationStatus: {
      type: String,
      enum: ["None", "Pending Review", "Under Evaluation", "Evaluated", "Rejected"],
      default: "None",
      index: true,
    },
    evaluations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evaluation",
      },
    ],
    averageEvaluationRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    evaluationCount: {
      type: Number,
      default: 0,
    },
    evaluationCriteriaAverages: {
      productQuality: { type: Number, default: 0 },
      creativityOriginality: { type: Number, default: 0 },
      craftsmanship: { type: Number, default: 0 },
      designFinishing: { type: Number, default: 0 },
      marketPotential: { type: Number, default: 0 },
    },
    isExpertRanked: {
      type: Boolean,
      default: false,
      index: true,
    },
    latestExpertFeedback: {
      type: String,
      trim: true,
      default: "",
    },
    latestExpertSuggestions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function () {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  // Sync isPublished with status
  if (this.isModified("status")) {
    this.isPublished = this.status === "Published";
  }
});

productSchema.methods.toSafeObject = function (artisanName, shopLocation) {
  const primaryImg = this.image || (this.images && this.images[0]) || "";
  const artisanDisplayName =
    artisanName ||
    (this.artisan && typeof this.artisan === "object" ? this.artisan.name : "") ||
    "SkillBridge Artisan";
  const resolvedLocation =
    shopLocation ||
    (this.shop && typeof this.shop === "object" ? this.shop.location : "") ||
    (this.artisan && typeof this.artisan === "object"
      ? [this.artisan.city, this.artisan.state].filter(Boolean).join(", ")
      : "") ||
    "India";

  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    listingId: this._id.toString(),
    ownerId: this.artisan?._id ? this.artisan._id.toString() : this.artisan ? this.artisan.toString() : "",
    artisanId: this.artisan?._id ? this.artisan._id.toString() : this.artisan ? this.artisan.toString() : "",
    shopId: this.shop?._id ? this.shop._id.toString() : this.shop ? this.shop.toString() : null,
    title: this.title,
    name: this.title,
    slug: this.slug || "",
    category: this.category,
    price: this.price,
    stock: this.stock,
    description: this.description || "",
    image: primaryImg,
    images: this.images && this.images.length ? this.images : primaryImg ? [primaryImg] : [],
    status: this.status,
    isPublished: this.isPublished,
    materialCost: this.materialCost || 0,
    laborHours: this.laborHours || 0,
    hourlyRate: this.hourlyRate || 0,
    packagingCost: this.packagingCost || 0,
    story: this.story || "",
    craftTime: this.craftTime || "",
    materials: this.materials || [],
    dimensions: this.dimensions || "",
    artisan: artisanDisplayName,
    artisanDetails:
      this.artisan && typeof this.artisan === "object"
        ? {
            id: this.artisan._id?.toString(),
            name: this.artisan.name,
            avatar: this.artisan.avatar,
            city: this.artisan.city,
            state: this.artisan.state,
            artCategory: this.artisan.artCategory,
            experience: this.artisan.experience,
          }
        : null,
    location: resolvedLocation,
    // Evaluation System fields
    evaluationStatus: this.evaluationStatus || "None",
    averageEvaluationRating: this.averageEvaluationRating || 0,
    evaluationCount: this.evaluationCount || 0,
    evaluationCriteriaAverages: this.evaluationCriteriaAverages || {
      productQuality: 0,
      creativityOriginality: 0,
      craftsmanship: 0,
      designFinishing: 0,
      marketPotential: 0,
    },
    isExpertRanked: Boolean(this.isExpertRanked),
    latestExpertFeedback: this.latestExpertFeedback || "",
    latestExpertSuggestions: this.latestExpertSuggestions || "",
    evaluations: Array.isArray(this.evaluations)
      ? this.evaluations.map((ev) =>
          typeof ev.toSafeObject === "function" ? ev.toSafeObject() : ev
        )
      : [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Product = mongoose.model("Product", productSchema);
