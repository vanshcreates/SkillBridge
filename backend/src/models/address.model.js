import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: "Home",
      enum: ["Home", "Work", "Other"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address line is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    label: this.label || "Home",
    fullName: this.fullName,
    phone: this.phone || "",
    email: this.email || "",
    address: this.address,
    city: this.city,
    state: this.state,
    postalCode: this.postalCode || "",
    isDefault: this.isDefault,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Address = mongoose.model("Address", addressSchema);

