import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
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
    stock: {
      type: Number,
      default: 1,
      min: [0, "Stock cannot be negative"],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
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
});

export const Product = mongoose.model("Product", productSchema);

