import mongoose from "mongoose";
import { Shop } from "../models/shop.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { Project } from "../models/project.model.js";
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
        folder: "skillbridge/products",
      });
      if (uploadRes?.secure_url) {
        uploadedImages.push(uploadRes.secure_url);
      }
    }

    if (req.body.image?.trim() && !uploadedImages.includes(req.body.image.trim())) {
      uploadedImages.push(req.body.image.trim());
    }
    if (Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        if (typeof img === "string" && img.trim() && !uploadedImages.includes(img.trim())) {
          uploadedImages.push(img.trim());
        }
      }
    }

    const primaryImage = uploadedImages[0] || "";

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
      image: primaryImage,
      images: uploadedImages,
      materialCost: Number(materialCost) || 0,
      laborHours: Number(laborHours) || 0,
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

      // Notify customer / industry partner if applicable
      if (order.customer) {
        try {
          // Check for linked industry project
          const project = await Project.findOne({
            $or: [
              { orderRef: order._id },
              { assignedArtisan: artisanId, title: order.items[0]?.title || order.items[0]?.name },
            ],
          });

          if (project) {
            if (["Processing", "Ready to ship", "Shipped"].includes(status)) {
              project.status = "Accepted";
              project.acceptanceDetails = {
                acceptedAt: new Date(),
                acceptedBy: artisanId,
                agreedPrice: order.items[0]?.price || project.unitPrice,
                agreedDuration: project.duration,
              };
            } else if (status === "Completed") {
              project.status = "Completed";
            } else if (status === "Rejected") {
              project.status = "Rejected";
            }
            await project.save();
          }

          // Build notification details
          const isAccepted = ["Processing", "Ready to ship", "Shipped"].includes(status);
          const isCompleted = status === "Completed";
          const isRejected = status === "Rejected";

          let notifType = "ORDER_STATUS_UPDATED";
          let notifTitle = `Order Status: ${status}`;
          let notifMessage = `Artisan ${req.user.name} updated your order #${order.orderNumber || order._id} to "${status}".`;

          if (isAccepted) {
            notifType = "ORDER_ACCEPTED";
            notifTitle = `Order Accepted by ${req.user.name}! 🌟`;
            notifMessage = `Artisan ${req.user.name} has accepted your order request for "${order.items[0]?.title || order.items[0]?.name}" (Quantity: ${order.items[0]?.quantity || 1}). Production has started!`;
          } else if (isCompleted) {
            notifType = "PROJECT_COMPLETED";
            notifTitle = `Order Completed by ${req.user.name}! 🎉`;
            notifMessage = `Artisan ${req.user.name} has completed order #${order.orderNumber || order._id} for "${order.items[0]?.title || order.items[0]?.name}". Please review and complete payment of ₹${(order.totalAmount || order.subtotal || 0).toLocaleString("en-IN")}.`;
          } else if (isRejected) {
            notifType = "ORDER_REJECTED";
            notifTitle = `Order Declined by ${req.user.name}`;
            notifMessage = `Artisan ${req.user.name} was unable to accept your production request for "${order.items[0]?.title || order.items[0]?.name}".`;
          }

          await Notification.create({
            recipient: order.customer,
            sender: artisanId,
            type: notifType,
            title: notifTitle,
            message: notifMessage,
            orderId: order._id,
            projectId: project ? project._id : null,
            metadata: {
              orderNumber: order.orderNumber,
              artisanName: req.user.name,
              itemTitle: order.items[0]?.title || order.items[0]?.name,
              status,
              price: order.items[0]?.price,
              quantity: order.items[0]?.quantity,
            },
          });
        } catch (notifErr) {
          console.warn("Failed to generate order status notification:", notifErr.message);
        }
      }
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
// 3B. RESPONSIBLE PROJECTS FOR ARTISANS
// ==========================================

export const getAvailableResponsibleProjects = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: "Open" };

    if (category && category !== "All") {
      filter.category = new RegExp(category.trim(), "i");
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { specifications: regex }, { category: regex }];
    }

    const projects = await Project.find(filter)
      .populate("industry", "name contactName email phone industry companyAddress")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects: projects.map((p) => p.toSafeObject(p.industry, null)),
    });
  } catch (error) {
    console.error("Get available responsible projects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve available projects.",
    });
  }
};

export const takeResponsibleProject = async (req, res) => {
  try {
    const { id } = req.params;
    const artisanId = req.user._id;

    const project = await Project.findById(id).populate("industry");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (project.status !== "Open" && project.status !== "Assigned") {
      return res.status(400).json({
        success: false,
        message: `This project is already ${project.status.toLowerCase()} and cannot be accepted.`,
      });
    }

    // If assigned to another artisan specifically
    if (
      project.assignedArtisan &&
      project.assignedArtisan.toString() !== artisanId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This project was assigned to another artisan.",
      });
    }

    // Accept project
    project.assignedArtisan = artisanId;
    project.status = "Accepted";
    project.acceptanceDetails = {
      acceptedAt: new Date(),
      acceptedBy: artisanId,
      agreedPrice: project.unitPrice,
      agreedDuration: project.duration,
      artisanNote: req.body.note || "Accepted by artisan.",
    };

    // Create or update linked order
    let order = null;
    if (project.orderRef) {
      order = await Order.findById(project.orderRef);
      if (order) {
        order.orderStatus = "Processing";
        order.items.forEach((item) => {
          item.itemStatus = "Processing";
          item.artisanId = artisanId;
          item.artisanName = req.user.name;
        });
        await order.save();
      }
    }

    if (!order) {
      const orderDeadlineStr = project.deadline
        ? new Date(project.deadline).toISOString().slice(0, 10)
        : "";

      order = await Order.create({
        customer: project.industry._id || project.industry,
        customerName: project.industry.contactName || project.industry.name || "Industry Partner",
        customerEmail: project.industry.email || "",
        customerPhone: project.industry.phone || "",
        items: [
          {
            title: project.title,
            name: project.title,
            category: project.category,
            price: project.unitPrice,
            quantity: project.quantity,
            artisanId: artisanId,
            artisanName: req.user.name,
            itemStatus: "Processing",
          },
        ],
        subtotal: project.totalBudget,
        shipping: 0,
        totalAmount: project.totalBudget,
        orderStatus: "Processing",
        source: "industry",
        deadline: orderDeadlineStr,
        specifications: project.specifications,
        shippingAddress: {
          fullName: project.industry.contactName || project.industry.name || "",
          phone: project.industry.phone || "",
          email: project.industry.email || "",
          address: project.industry.companyAddress || "",
        },
      });

      project.orderRef = order._id;
    }

    await project.save();

    // Create Notification for the Industry partner
    await Notification.create({
      recipient: project.industry._id || project.industry,
      sender: artisanId,
      type: "PROJECT_ACCEPTED",
      title: `Artisan ${req.user.name} Accepted Your Project! 🌟`,
      message: `Artisan ${req.user.name} (${req.user.artCategory || "Traditional Artisan"}) has accepted your responsible project "${project.title}"! Production has started according to the offered ₹${project.unitPrice.toLocaleString("en-IN")}/unit and ${project.duration} timeline.`,
      orderId: order._id,
      projectId: project._id,
      metadata: {
        artisanName: req.user.name,
        artisanEmail: req.user.email,
        artisanPhone: req.user.phone,
        projectTitle: project.title,
        price: project.unitPrice,
        duration: project.duration,
      },
    });

    return res.status(200).json({
      success: true,
      message: `You have successfully accepted "${project.title}". It is now in your active orders!`,
      project: project.toSafeObject(project.industry, req.user),
      order: order.toArtisanOrder(artisanId),
    });
  } catch (error) {
    console.error("Take responsible project error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to accept responsible project.",
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
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const course = isObjectId
      ? await Course.findById(id)
      : await Course.findOne({ slug: id });

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
    const { name, phone, bio, artCategory, experience, city, state, hourlyRate } = req.body;

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (artCategory !== undefined) user.artCategory = String(artCategory).trim();
    if (experience !== undefined) user.experience = String(experience).trim();
    if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate) || 0;
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

export const uploadArtisanProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please choose an image file to upload.",
      });
    }

    const uploadRes = await uploadOnCloudinary(req.file.path, {
      folder: "skillbridge/avatars",
    });

    if (!uploadRes?.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to cloud storage. Please check Cloudinary configuration.",
      });
    }

    const user = await User.findById(req.user._id);
    user.avatar = uploadRes.secure_url;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      avatar: user.avatar,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Upload artisan profile photo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile photo.",
    });
  }
};

export const removeArtisanProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.avatar = "";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully.",
      avatar: "",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Remove artisan profile photo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove profile photo.",
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

    const paidOrders = completed.filter((order) => order.paymentStatus === "paid");
    const awaitingPaymentOrders = completed.filter((order) => order.paymentStatus !== "paid");

    const totalEarnings = paidOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const pendingPayout =
      awaitingPaymentOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0) +
      pending.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    const payouts = completed.map((order) => ({
      orderId: order.id,
      date: order.createdAt,
      paidAt: order.paidAt || null,
      amount: order.subtotal,
      customerName: order.customer?.fullName || "Customer",
      itemsCount: order.items?.length || 0,
      paymentStatus: order.paymentStatus === "paid" ? "Paid" : "Payment Pending from Industry",
      razorpayPaymentId: order.razorpayPaymentId || "",
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

