import { Shop } from "../models/shop.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ==========================================
// 1. DASHBOARD COLUMN
// ==========================================

export const getArtisanDashboard = async (req, res) => {
  try {
    const artisanId = req.user._id;

    // Fetch shop
    const shop = await Shop.findOne({ artisan: artisanId });

    // Fetch product listings count
    const totalListings = await Product.countDocuments({ artisan: artisanId });
    const publishedListings = await Product.countDocuments({
      artisan: artisanId,
      status: "Published",
    });

    // Fetch artisan's orders
    const orders = await Order.find({ "items.artisanId": artisanId }).sort({
      createdAt: -1,
    });

    const formattedOrders = orders.map((order) =>
      order.toArtisanOrder(artisanId)
    );

    // Calculate orders to fulfill (active statuses)
    const activeStatuses = [
      "Awaiting response",
      "Processing",
      "Ready to ship",
      "Shipped",
    ];

    const ordersToFulfill = formattedOrders.filter((order) =>
      activeStatuses.includes(order.status)
    ).length;

    // Calculate total payments / earnings from completed orders
    const completedOrders = formattedOrders.filter(
      (order) => order.status === "Completed"
    );

    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + (order.subtotal || 0),
      0
    );

    // Count available training courses
    const coursesCount = await Course.countDocuments({ isPublished: true });

    return res.status(200).json({
      success: true,
      stats: {
        listingsCount: totalListings,
        publishedCount: publishedListings,
        ordersToFulfill,
        coursesCount,
        totalEarnings,
      },
      shop: shop ? shop.toSafeObject() : null,
      recentOrders: formattedOrders.slice(0, 5),
      recentListings: (
        await Product.find({ artisan: artisanId })
          .sort({ createdAt: -1 })
          .limit(5)
      ).map((p) => p.toSafeObject(req.user.name, shop?.location)),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load artisan dashboard data.",
    });
  }
};

// ==========================================
// 2. MY SHOP & PRODUCT LISTINGS COLUMN
// ==========================================

export const getArtisanShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ artisan: req.user._id });
    return res.status(200).json({
      success: true,
      shop: shop ? shop.toSafeObject() : null,
    });
  } catch (error) {
    console.error("Get shop error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve shop details.",
    });
  }
};

export const saveArtisanShop = async (req, res) => {
  try {
    const { name, category, location, description } = req.body;

    if (!name?.trim() || !category?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shop name, craft category, and description are required.",
      });
    }

    let bannerUrl = req.body.banner || "";
    let logoUrl = req.body.logo || "";

    // Upload banner or logo if provided via Multer
    if (req.files) {
      if (req.files.banner && req.files.banner[0]) {
        const uploadRes = await uploadOnCloudinary(req.files.banner[0].path);
        if (uploadRes?.secure_url) bannerUrl = uploadRes.secure_url;
      }
      if (req.files.logo && req.files.logo[0]) {
        const uploadRes = await uploadOnCloudinary(req.files.logo[0].path);
        if (uploadRes?.secure_url) logoUrl = uploadRes.secure_url;
      }
    }

    let shop = await Shop.findOne({ artisan: req.user._id });

    if (shop) {
      shop.name = name.trim();
      shop.category = category.trim();
      shop.location = location?.trim() || "";
      shop.description = description.trim();
      if (bannerUrl) shop.banner = bannerUrl;
      if (logoUrl) shop.logo = logoUrl;
      await shop.save();
    } else {
      shop = await Shop.create({
        artisan: req.user._id,
        name: name.trim(),
        category: category.trim(),
        location: location?.trim() || "",
        description: description.trim(),
        banner: bannerUrl,
        logo: logoUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shop saved successfully.",
      shop: shop.toSafeObject(),
    });
  } catch (error) {
    console.error("Save shop error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save shop details.",
    });
  }
};

export const getArtisanProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ artisan: req.user._id });
    const products = await Product.find({ artisan: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      listings: products.map((product) =>
        product.toSafeObject(req.user.name, shop?.location)
      ),
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve product listings.",
    });
  }
};

export const createArtisanProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ artisan: req.user._id });
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Please create your shop before adding products.",
      });
    }

    const {
      title,
      category,
      price,
      stock,
      description,
      materialCost,
      laborHours,
      hourlyRate,
      packagingCost,
      dimensions,
      craftTime,
      story,
      materials,
    } = req.body;

    if (!title?.trim() || !category?.trim() || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product title, category, price, and stock are required.",
      });
    }

    let imageUrl = req.body.image?.trim() || "";

    // If an image file was uploaded via Multer, upload to Cloudinary
    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url) {
        imageUrl = uploadRes.secure_url;
      }
    }

    const parsedMaterials = Array.isArray(materials)
      ? materials
      : typeof materials === "string" && materials.trim()
      ? materials.split(",").map((m) => m.trim()).filter(Boolean)
      : [];

    const product = await Product.create({
      artisan: req.user._id,
      shop: shop._id,
      title: title.trim(),
      category: category.trim(),
      price: Number(price),
      stock: Number(stock),
      description: description?.trim() || "",
      image: imageUrl,
      images: imageUrl ? [imageUrl] : [],
      materialCost: Number(materialCost) || 0,
      laborHours: Number(laborHours) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      packagingCost: Number(packagingCost) || 0,
      dimensions: dimensions?.trim() || "",
      craftTime: craftTime?.trim() || "",
      story: story?.trim() || "",
      materials: parsedMaterials,
      status: "Draft",
      isPublished: false,
    });

    return res.status(201).json({
      success: true,
      message: "Product saved as draft.",
      listing: product.toSafeObject(req.user.name, shop.location),
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product listing.",
    });
  }
};

export const publishArtisanProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findOne({ artisan: req.user._id });
    const product = await Product.findOne({ _id: id, artisan: req.user._id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product listing not found.",
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "Products must have at least 1 item in stock to be published.",
      });
    }

    product.status = "Published";
    product.isPublished = true;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product published to marketplace.",
      listing: product.toSafeObject(req.user.name, shop?.location),
    });
  } catch (error) {
    console.error("Publish product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish product.",
    });
  }
};

export const unpublishArtisanProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findOne({ artisan: req.user._id });
    const product = await Product.findOne({ _id: id, artisan: req.user._id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product listing not found.",
      });
    }

    product.status = "Draft";
    product.isPublished = false;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product moved back to draft.",
      listing: product.toSafeObject(req.user.name, shop?.location),
    });
  } catch (error) {
    console.error("Unpublish product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to unpublish product.",
    });
  }
};

export const deleteArtisanProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({
      _id: id,
      artisan: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product listing not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product.",
    });
  }
};

// ==========================================
// 3. ORDERS COLUMN
// ==========================================

export const getArtisanOrders = async (req, res) => {
  try {
    const artisanId = req.user._id;
    const orders = await Order.find({ "items.artisanId": artisanId }).sort({
      createdAt: -1,
    });

    const formatted = orders.map((order) => order.toArtisanOrder(artisanId));

    return res.status(200).json({
      success: true,
      orders: formatted,
    });
  } catch (error) {
    console.error("Get artisan orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve orders.",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const artisanId = req.user._id;

    const validStatuses = [
      "Awaiting response",
      "Processing",
      "Ready to ship",
      "Shipped",
      "Completed",
      "Rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    // Search by either MongoDB _id or orderNumber
    let order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id }],
      "items.artisanId": artisanId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for your artisan account.",
      });
    }

    // Update status on all items belonging to this artisan
    let itemUpdated = false;
    order.items.forEach((item) => {
      if (item.artisanId && item.artisanId.toString() === artisanId.toString()) {
        item.itemStatus = status;
        itemUpdated = true;
      }
    });

    if (itemUpdated) {
      order.orderStatus = status;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      order: order.toArtisanOrder(artisanId),
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
};

// ==========================================
// 4. TRAINING COLUMN
// ==========================================

export const getArtisanCourses = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { isPublished: true };

    if (category && category !== "All courses") {
      query.category = category;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { instructor: searchRegex },
        { category: searchRegex },
      ];
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      courses: courses.map((course) => course.toSafeObject()),
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve training courses.",
    });
  }
};

export const getArtisanCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      success: true,
      course: course.toSafeObject(),
    });
  } catch (error) {
    console.error("Get course error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve course details.",
    });
  }
};

// ==========================================
// 5. PROFILE INFO COLUMN
// ==========================================

export const getArtisanProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const shop = await Shop.findOne({ artisan: req.user._id });

    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
      shop: shop ? shop.toSafeObject() : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve profile.",
    });
  }
};

export const updateArtisanProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, bio, artCategory, experience, city, state } = req.body;

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (artCategory !== undefined) user.artCategory = String(artCategory).trim();
    if (experience !== undefined) user.experience = String(experience).trim();
    if (city !== undefined) user.city = String(city).trim();
    if (state !== undefined) user.state = String(state).trim();

    // Upload new avatar if provided
    if (req.file) {
      const uploadRes = await uploadOnCloudinary(req.file.path);
      if (uploadRes?.secure_url) {
        user.avatar = uploadRes.secure_url;
      }
    } else if (req.body.avatar?.trim()) {
      user.avatar = req.body.avatar.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

// ==========================================
// 6. PAYMENT HISTORY COLUMN
// ==========================================

export const getArtisanPayments = async (req, res) => {
  try {
    const artisanId = req.user._id;
    const orders = await Order.find({ "items.artisanId": artisanId }).sort({
      createdAt: -1,
    });

    const formattedOrders = orders.map((order) =>
      order.toArtisanOrder(artisanId)
    );

    const completed = formattedOrders.filter(
      (order) => order.status === "Completed"
    );

    const pending = formattedOrders.filter((order) =>
      ["Processing", "Ready to ship", "Shipped"].includes(order.status)
    );

    const totalEarnings = completed.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const pendingPayout = pending.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    const payouts = completed.map((order) => ({
      orderId: order.id,
      date: order.createdAt,
      amount: order.subtotal,
      customerName: order.customer?.fullName || "Customer",
      itemsCount: order.items?.length || 0,
      paymentStatus: "Paid",
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalEarnings,
        pendingPayout,
        payoutsCount: payouts.length,
      },
      payouts,
    });
  } catch (error) {
    console.error("Payments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve payment records.",
    });
  }
};

