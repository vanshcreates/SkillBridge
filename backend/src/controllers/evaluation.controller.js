import { Product } from "../models/product.model.js";
import { Evaluation } from "../models/evaluation.model.js";
import { Shop } from "../models/shop.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const sanitizeNumber = (val, min, max, defaultVal = 1) => {
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
};

// ============================================================
// ARTISAN CONTROLLERS
// ============================================================

/**
 * @desc    Submit a product for expert evaluation
 * @route   POST /api/artisan/evaluations/submit
 * @access  Private (Artisan)
 */
export const submitProductForEvaluation = async (req, res) => {
  try {
    const artisanId = req.user._id;
    const {
      productId,
      title,
      name,
      description,
      category,
      expectedPrice,
      price,
      stock,
    } = req.body;

    const productTitle = (title || name || "").trim();
    const productDesc = (description || "").trim();
    const productCat = (category || "").trim();
    const resolvedPrice = Number(expectedPrice || price || 0);

    // Collect uploaded image files from multer
    const uploadedImages = [];
    const filesToUpload = [];

    if (Array.isArray(req.files)) {
      filesToUpload.push(...req.files);
    } else if (req.files && typeof req.files === "object") {
      if (Array.isArray(req.files.images)) filesToUpload.push(...req.files.images);
      if (Array.isArray(req.files.image)) filesToUpload.push(...req.files.image);
    } else if (req.file) {
      filesToUpload.push(req.file);
    }

    for (const f of filesToUpload) {
      const uploadRes = await uploadOnCloudinary(f.path, {
        folder: "skillbridge/evaluations",
      });
      if (uploadRes?.secure_url) {
        uploadedImages.push(uploadRes.secure_url);
      }
    }

    // Also support string image URLs passed in body
    if (req.body.image && typeof req.body.image === "string" && req.body.image.trim()) {
      if (!uploadedImages.includes(req.body.image.trim())) {
        uploadedImages.push(req.body.image.trim());
      }
    }
    if (Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        if (typeof img === "string" && img.trim() && !uploadedImages.includes(img.trim())) {
          uploadedImages.push(img.trim());
        }
      }
    }

    let product;

    // Case 1: Submitting an existing listing for evaluation
    if (productId) {
      product = await Product.findOne({ _id: productId, artisan: artisanId });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      if (productTitle) product.title = productTitle;
      if (productDesc) product.description = productDesc;
      if (productCat) product.category = productCat;
      if (resolvedPrice > 0) product.price = resolvedPrice;

      if (uploadedImages.length > 0) {
        product.images = [...new Set([...(product.images || []), ...uploadedImages])];
        if (!product.image) product.image = uploadedImages[0];
      }

      product.evaluationStatus = "Pending Review";
      await product.save();
    } else {
      // Case 2: Submitting a new craft piece for evaluation
      if (!productTitle || !productCat) {
        return res.status(400).json({
          success: false,
          message: "Product name and category are required for evaluation.",
        });
      }

      let shop = await Shop.findOne({ artisan: artisanId });

      product = await Product.create({
        artisan: artisanId,
        shop: shop?._id || null,
        title: productTitle,
        category: productCat,
        description: productDesc,
        price: resolvedPrice,
        stock: Number(stock) || 1,
        image: uploadedImages[0] || "",
        images: uploadedImages,
        evaluationStatus: "Pending Review",
        status: "Draft",
        isPublished: false,
      });
    }

    // Create notification for artisan
    try {
      await Notification.create({
        user: artisanId,
        title: "Product Sent for Evaluation",
        message: `"${product.title}" has been successfully submitted for expert evaluation. A verified craft expert will review its quality and design shortly.`,
        type: "evaluation",
      });
    } catch (notifErr) {
      console.warn("Notification error:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your craft has been submitted for expert evaluation.",
      product: product.toSafeObject(req.user.name),
    });
  } catch (error) {
    console.error("Submit product for evaluation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit product for evaluation.",
    });
  }
};

/**
 * @desc    Get all evaluation submissions for current artisan
 * @route   GET /api/artisan/evaluations
 * @access  Private (Artisan)
 */
export const getArtisanEvaluations = async (req, res) => {
  try {
    const artisanId = req.user._id;

    const products = await Product.find({
      artisan: artisanId,
      evaluationStatus: { $ne: "None" },
    })
      .populate({
        path: "evaluations",
        populate: {
          path: "expert",
          select: "name avatar expertise email",
        },
      })
      .sort({ updatedAt: -1 });

    const formattedProducts = products.map((prod) => {
      const safe = prod.toSafeObject(req.user.name);
      safe.evaluationsList = (prod.evaluations || []).map((ev) =>
        typeof ev.toSafeObject === "function"
          ? ev.toSafeObject(ev.expert)
          : ev
      );
      return safe;
    });

    return res.status(200).json({
      success: true,
      evaluations: formattedProducts,
      totalCount: formattedProducts.length,
      pendingCount: formattedProducts.filter(
        (p) => p.evaluationStatus === "Pending Review" || p.evaluationStatus === "Under Evaluation"
      ).length,
      evaluatedCount: formattedProducts.filter((p) => p.evaluationStatus === "Evaluated").length,
    });
  } catch (error) {
    console.error("Get artisan evaluations error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load product evaluations.",
    });
  }
};

/**
 * @desc    Get evaluation details for a specific product
 * @route   GET /api/artisan/evaluations/:productId
 * @access  Private (Artisan)
 */
export const getArtisanEvaluationById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({
      _id: productId,
      artisan: req.user._id,
    }).populate({
      path: "evaluations",
      populate: {
        path: "expert",
        select: "name avatar expertise email",
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Evaluated product not found.",
      });
    }

    const safeProduct = product.toSafeObject(req.user.name);
    safeProduct.evaluationsList = (product.evaluations || []).map((ev) =>
      typeof ev.toSafeObject === "function" ? ev.toSafeObject(ev.expert) : ev
    );

    return res.status(200).json({
      success: true,
      product: safeProduct,
    });
  } catch (error) {
    console.error("Get artisan evaluation by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve evaluation details.",
    });
  }
};

// ============================================================
// EXPERT CONTROLLERS
// ============================================================

/**
 * @desc    Get products waiting for expert evaluation
 * @route   GET /api/expert/evaluations/queue
 * @access  Private (Verified Expert)
 */
export const getExpertEvaluationQueue = async (req, res) => {
  try {
    const { status = "all", category, search } = req.query;

    const query = {};

    if (status === "pending") {
      query.evaluationStatus = { $in: ["Pending Review", "Under Evaluation"] };
    } else if (status === "evaluated") {
      query.evaluationStatus = "Evaluated";
    } else if (status === "rejected") {
      query.evaluationStatus = "Rejected";
    } else {
      query.evaluationStatus = { $ne: "None" };
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (search?.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const [products, pendingCount, evaluatedCount] = await Promise.all([
      Product.find(query)
        .populate("artisan", "name avatar city state phone bio artCategory experience")
        .populate("shop", "name location")
        .populate({
          path: "evaluations",
          populate: { path: "expert", select: "name avatar expertise" },
        })
        .sort({ updatedAt: -1 }),
      Product.countDocuments({
        evaluationStatus: { $in: ["Pending Review", "Under Evaluation"] },
      }),
      Product.countDocuments({ evaluationStatus: "Evaluated" }),
    ]);

    const formattedProducts = products.map((prod) => {
      const safe = prod.toSafeObject(prod.artisan?.name, prod.shop?.location);
      safe.evaluationsList = (prod.evaluations || []).map((ev) =>
        typeof ev.toSafeObject === "function" ? ev.toSafeObject(ev.expert) : ev
      );
      // Check if current expert has already evaluated this product
      safe.hasEvaluatedByMe = (prod.evaluations || []).some((ev) => {
        const expId = ev.expert?._id || ev.expert;
        return expId && expId.toString() === req.user._id.toString();
      });
      return safe;
    });

    return res.status(200).json({
      success: true,
      queue: formattedProducts,
      stats: {
        total: formattedProducts.length,
        pending: pendingCount,
        evaluated: evaluatedCount,
      },
    });
  } catch (error) {
    console.error("Get expert evaluation queue error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load evaluation queue.",
    });
  }
};

/**
 * @desc    Get product details for evaluation
 * @route   GET /api/expert/evaluations/product/:productId
 * @access  Private (Verified Expert)
 */
export const getEvaluationProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate("artisan", "name avatar city state phone bio artCategory experience")
      .populate("shop", "name location")
      .populate({
        path: "evaluations",
        populate: { path: "expert", select: "name avatar expertise" },
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const safeProduct = product.toSafeObject(product.artisan?.name, product.shop?.location);
    safeProduct.evaluationsList = (product.evaluations || []).map((ev) =>
      typeof ev.toSafeObject === "function" ? ev.toSafeObject(ev.expert) : ev
    );
    safeProduct.hasEvaluatedByMe = (product.evaluations || []).some((ev) => {
      const expId = ev.expert?._id || ev.expert;
      return expId && expId.toString() === req.user._id.toString();
    });

    return res.status(200).json({
      success: true,
      product: safeProduct,
    });
  } catch (error) {
    console.error("Get evaluation product details error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve product details.",
    });
  }
};

/**
 * @desc    Mark product as 'Under Evaluation' when expert begins review
 * @route   PATCH /api/expert/evaluations/product/:productId/start
 * @access  Private (Verified Expert)
 */
export const startProductEvaluation = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.evaluationStatus === "Pending Review") {
      product.evaluationStatus = "Under Evaluation";
      await product.save();
    }

    return res.status(200).json({
      success: true,
      message: "Product status updated to Under Evaluation.",
      evaluationStatus: product.evaluationStatus,
    });
  } catch (error) {
    console.error("Start product evaluation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update evaluation status.",
    });
  }
};

/**
 * @desc    Submit expert evaluation with 5 criteria scores (1-10) and feedback
 * @route   POST /api/expert/evaluations/product/:productId/evaluate
 * @access  Private (Verified Expert)
 */
export const submitExpertEvaluation = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { productId } = req.params;

    const {
      productQuality,
      creativityOriginality,
      craftsmanship,
      designFinishing,
      marketPotential,
      feedback,
      suggestions,
      recommendedPrice,
      verdict = "Evaluated", // "Evaluated" or "Rejected"
    } = req.body;

    if (!feedback?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Written expert feedback is required.",
      });
    }

    const q = sanitizeNumber(productQuality, 1, 10, 5);
    const cr = sanitizeNumber(creativityOriginality, 1, 10, 5);
    const cm = sanitizeNumber(craftsmanship, 1, 10, 5);
    const df = sanitizeNumber(designFinishing, 1, 10, 5);
    const mp = sanitizeNumber(marketPotential, 1, 10, 5);

    // Calculate overall rating for this expert evaluation
    const individualOverall = Math.round(((q + cr + cm + df + mp) / 5) * 10) / 10;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product to evaluate was not found.",
      });
    }

    // Check if this expert has already evaluated this product; if so, update their existing evaluation
    let evaluation = await Evaluation.findOne({
      product: product._id,
      expert: expertId,
    });

    const isRejected = verdict === "Rejected";

    if (evaluation) {
      evaluation.productQuality = q;
      evaluation.creativityOriginality = cr;
      evaluation.craftsmanship = cm;
      evaluation.designFinishing = df;
      evaluation.marketPotential = mp;
      evaluation.overallScore = individualOverall;
      evaluation.feedback = feedback.trim();
      evaluation.suggestions = (suggestions || "").trim();
      evaluation.recommendedPrice = recommendedPrice ? Number(recommendedPrice) : null;
      evaluation.status = isRejected ? "Rejected" : "Evaluated";
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        product: product._id,
        artisan: product.artisan,
        expert: expertId,
        productQuality: q,
        creativityOriginality: cr,
        craftsmanship: cm,
        designFinishing: df,
        marketPotential: mp,
        overallScore: individualOverall,
        feedback: feedback.trim(),
        suggestions: (suggestions || "").trim(),
        recommendedPrice: recommendedPrice ? Number(recommendedPrice) : null,
        status: isRejected ? "Rejected" : "Evaluated",
      });

      if (!product.evaluations.includes(evaluation._id)) {
        product.evaluations.push(evaluation._id);
      }
    }

    // Recalculate multi-expert averages
    const allEvaluations = await Evaluation.find({
      product: product._id,
      status: "Evaluated",
    });

    if (isRejected && allEvaluations.length === 0) {
      product.evaluationStatus = "Rejected";
      product.averageEvaluationRating = 0;
      product.evaluationCount = 0;
      product.isExpertRanked = false;
    } else if (allEvaluations.length > 0) {
      const count = allEvaluations.length;
      const sumOverall = allEvaluations.reduce((sum, ev) => sum + ev.overallScore, 0);
      const sumQ = allEvaluations.reduce((sum, ev) => sum + ev.productQuality, 0);
      const sumCr = allEvaluations.reduce((sum, ev) => sum + ev.creativityOriginality, 0);
      const sumCm = allEvaluations.reduce((sum, ev) => sum + ev.craftsmanship, 0);
      const sumDf = allEvaluations.reduce((sum, ev) => sum + ev.designFinishing, 0);
      const sumMp = allEvaluations.reduce((sum, ev) => sum + ev.marketPotential, 0);

      const finalRating = Math.round((sumOverall / count) * 10) / 10;

      product.evaluationStatus = "Evaluated";
      product.averageEvaluationRating = finalRating;
      product.evaluationCount = count;
      product.evaluationCriteriaAverages = {
        productQuality: Math.round((sumQ / count) * 10) / 10,
        creativityOriginality: Math.round((sumCr / count) * 10) / 10,
        craftsmanship: Math.round((sumCm / count) * 10) / 10,
        designFinishing: Math.round((sumDf / count) * 10) / 10,
        marketPotential: Math.round((sumMp / count) * 10) / 10,
      };

      // Ranked badge if average is 7.0 or higher
      product.isExpertRanked = finalRating >= 7.0;
      product.latestExpertFeedback = feedback.trim();
      product.latestExpertSuggestions = (suggestions || "").trim();

      // If recommended price provided, artisan can consider it
      if (recommendedPrice && Number(recommendedPrice) > 0) {
        product.hourlyRate = product.hourlyRate || 0;
      }
    }

    await product.save();

    // Send notification to artisan
    try {
      await Notification.create({
        user: product.artisan,
        title: isRejected ? "Product Evaluation Feedback" : "Product Evaluation Completed!",
        message: isRejected
          ? `Your product "${product.title}" has received feedback from ${req.user.name}. View suggestions to refine your craft.`
          : `Your product "${product.title}" received a professional rating of ${individualOverall}/10 from ${req.user.name}.`,
        type: "evaluation",
      });
    } catch (notifErr) {
      console.warn("Artisan notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: isRejected
        ? "Evaluation feedback recorded as rejected."
        : "Expert evaluation submitted successfully.",
      evaluation: evaluation.toSafeObject(req.user),
      product: product.toSafeObject(),
    });
  } catch (error) {
    console.error("Submit expert evaluation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit product evaluation.",
    });
  }
};

/**
 * @desc    Toggle or update expert verification status (convenience / administration)
 * @route   POST /api/expert/verify-status
 * @access  Private (Expert)
 */
export const toggleExpertSelfVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.accountType !== "expert") {
      return res.status(403).json({ success: false, message: "Only expert accounts allowed." });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Expert account verified successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// MARKETPLACE & INDUSTRY CONTROLLERS
// ============================================================

/**
 * @desc    Get top expert-ranked artisan products
 * @route   GET /api/marketplace/ranked-products
 * @access  Public / Industrialist
 */
export const getRankedArtisanProducts = async (req, res) => {
  try {
    const { category, minRating = 0, limit = 20 } = req.query;

    const query = {
      evaluationStatus: "Evaluated",
      averageEvaluationRating: { $gte: Number(minRating) || 0 },
    };

    if (category && category !== "All") {
      query.category = category;
    }

    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));

    const products = await Product.find(query)
      .populate("artisan", "name avatar city state artCategory experience phone")
      .populate("shop", "name location")
      .sort({ averageEvaluationRating: -1, evaluationCount: -1 })
      .limit(limitNum);

    const formatted = products.map((prod, idx) => ({
      ...prod.toSafeObject(prod.artisan?.name, prod.shop?.location),
      rank: idx + 1,
    }));

    return res.status(200).json({
      success: true,
      products: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("Get ranked artisan products error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve ranked products.",
    });
  }
};

