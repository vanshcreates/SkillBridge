import { User } from "../models/user.model.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// @desc    Register a new user
// @route   POST /api/auth/signup or /api/auth/register
// @access  Public
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      accountType = "customer",
      phone,
      city,
      state,
      bio,
      artCategory,
      experience,
      expertise,
      contactName,
      industry,
      companyAddress,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in instead.",
      });
    }

    const allowedRoles = ["customer", "artisan", "expert", "industry"];
    const normalizedRole = allowedRoles.includes(accountType)
      ? accountType
      : "customer";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      accountType: normalizedRole,
      phone: phone?.trim() || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      bio: bio?.trim() || "",
      artCategory: artCategory?.trim() || "",
      experience: experience?.trim() || "",
      expertise: expertise?.trim() || "",
      contactName: contactName?.trim() || "",
      industry: industry?.trim() || "",
      companyAddress: companyAddress?.trim() || "",
    });

    const token = user.generateAccessToken();
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create account. Please try again.",
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, accountType } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // If an accountType was specified (e.g., from artisan or industry login page), verify match
    if (accountType && user.accountType !== accountType) {
      return res.status(401).json({
        success: false,
        message: `Account is registered as "${user.accountType}", not "${accountType}".`,
      });
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = user.generateAccessToken();
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed. Please try again.",
    });
  }
};

// @desc    Verify authentication token and return current user
// @route   GET /api/auth/verify or POST /api/auth/verify
// @access  Private (via verifyJWT middleware)
export const verify = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Token is valid.",
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify token.",
    });
  }
};

// @desc    Verify an account (e.g. email or manual verification)
// @route   POST /api/auth/verify-account
// @access  Public / Private
export const verifyAccount = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({
        success: false,
        message: "Email or verification token is required.",
      });
    }

    let user;
    if (token) {
      user = await User.findOne({ verificationToken: token });
    } else if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided credentials.",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Account verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify account.",
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", getCookieOptions());
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed.",
    });
  }
};

// @desc    Fetch registered artisans
// @route   GET /api/auth/artisans
// @access  Public
export const getArtisans = async (req, res) => {
  try {
    const artisans = await User.find({ accountType: "artisan" }).select("-password");
    return res.status(200).json({
      success: true,
      artisans: artisans.map((artisan) => artisan.toSafeObject()),
    });
  } catch (error) {
    console.error("Fetch artisans error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve artisans.",
    });
  }
};

