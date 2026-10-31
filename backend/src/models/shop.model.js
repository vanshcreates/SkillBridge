import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: [true, "Shop category is required"],
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, "Shop description is required"],
      trim: true,
      maxlength: 1000,
    },
    banner: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    ownerId: this.artisan.toString(),
    artisan: this.artisan.toString(),
    name: this.name,
    category: this.category,
    location: this.location || "",
    description: this.description,
    banner: this.banner || "",
    logo: this.logo || "",
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Shop = mongoose.model("Shop", shopSchema);

