import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    accountType: {
      type: String,
      enum: ["customer", "artisan", "expert", "industry"],
      default: "customer",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    // Artisan specific fields
    artCategory: {
      type: String,
      trim: true,
      default: "",
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    // Expert specific fields
    expertise: {
      type: String,
      trim: true,
      default: "",
    },
    // Industry specific fields
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    companyAddress: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT access token
userSchema.methods.generateAccessToken = function () {
  const secret = process.env.JWT_SECRET || "byteforce_super_secret_jwt_key_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      _id: this._id,
      id: this._id,
      email: this.email,
      name: this.name,
      accountType: this.accountType,
    },
    secret,
    { expiresIn }
  );
};

// Transform to safe user object for responses
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    accountType: this.accountType,
    phone: this.phone || "",
    city: this.city || "",
    state: this.state || "",
    bio: this.bio || "",
    artCategory: this.artCategory || "",
    experience: this.experience || "",
    expertise: this.expertise || "",
    contactName: this.contactName || "",
    industry: this.industry || "",
    companyAddress: this.companyAddress || "",
    avatar: this.avatar || "",
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model("User", userSchema);

