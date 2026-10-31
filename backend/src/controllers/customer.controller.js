import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { Address } from "../models/address.model.js";
import { Product } from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

// @desc    Get customer profile + order stats
// @route   GET /api/customer/profile
// @access  Customer Only
export const getCustomerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -verificationToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [orderCount, totalSpentAgg, wishlistCount, addressCount] = await Promise.all([
      Order.countDocuments({ customer: user._id }),
      Order.aggregate([
        {
          $match: {
            customer: user._id,
            paymentStatus: "paid",
            orderStatus: { $ne: "Rejected" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Wishlist.countDocuments({ customer: user._id }),
      Address.countDocuments({ owner: user._id }),
    ]);

    const totalSpent = totalSpentAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      profile: {
        ...user.toSafeObject(),
        stats: {
          totalOrders: orderCount,
          totalSpent,
          wishlistCount,
          addressCount,
        },
      },
    });
  } catch (error) {
    console.error("Get customer profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile.",
    });
  }
};

// @desc    Update customer profile (name, phone, bio, city, state)
// @route   PUT /api/customer/profile
// @access  Customer Only
export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, bio, city, state } = req.body;

    const allowedUpdates = {};
    for (const [field, value] of Object.entries({
      name,
      phone,
      bio,
      city,
      state,
    })) {
      if (value === undefined) continue;
      if (typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        });
      }
      if (field === "name" && !value.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }
      if (value.length > (field === "bio" ? 500 : 100)) {
        return res.status(400).json({
          success: false,
          message: `${field} is too long.`,
        });
      }
      allowedUpdates[field] = value.trim();
    }

    if (!Object.keys(allowedUpdates).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-password -verificationToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Update customer profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

// @desc    Upload / change customer avatar photo
// @route   POST /api/customer/profile/photo
// @access  Customer Only
export const uploadCustomerAvatar = async (req, res) => {
  try {
    const imageBase64 = req.body?.imageBase64;
    const isAllowedImageType = ["image/jpeg", "image/png", "image/webp"].includes(
      req.file?.mimetype,
    );
    const validBase64 =
      typeof imageBase64 === "string" &&
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(imageBase64) &&
      imageBase64.length <= 7 * 1024 * 1024

    if (!req.file && !validBase64) {
      return res.status(400).json({ success: false, message: "No image provided." });
    }
    if (req.file && !isAllowedImageType) {
      return res.status(400).json({
        success: false,
        message: "Choose a JPG, PNG, or WebP image.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let uploadResult;
    if (req.file) {
      // Upload from multer buffer
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "skillbridge/avatars", resource_type: "image" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
    } else {
      // Upload from base64 string
      uploadResult = await cloudinary.uploader.upload(imageBase64, {
        folder: "skillbridge/avatars",
        resource_type: "image",
      });
    }

    if (!uploadResult?.secure_url) {
      return res.status(502).json({
        success: false,
        message: "The profile photo could not be uploaded. Please try again.",
      });
    }

    const previousAvatar = user.avatar;
    user.avatar = uploadResult.secure_url;
    await user.save({ validateBeforeSave: false });

    if (previousAvatar && previousAvatar.includes("cloudinary")) {
      const publicId = getCloudinaryPublicId(previousAvatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (error) {
          console.warn(
            "Unable to remove previous customer avatar from Cloudinary:",
            error.message,
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      avatar: user.avatar,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar.",
    });
  }
};

// @desc    Remove customer avatar photo
// @route   DELETE /api/customer/profile/photo
// @access  Customer Only
export const removeCustomerAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const previousAvatar = user.avatar;
    user.avatar = "";
    await user.save({ validateBeforeSave: false });

    if (previousAvatar && previousAvatar.includes("cloudinary")) {
      const publicId = getCloudinaryPublicId(previousAvatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (error) {
          console.warn(
            "Unable to remove customer avatar from Cloudinary:",
            error.message,
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Avatar removed successfully.",
      avatar: "",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove avatar.",
    });
  }
};

function getCloudinaryPublicId(avatarUrl) {
  try {
    const pathname = new URL(avatarUrl).pathname
    const match = pathname.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/)
    return match?.[1] || ""
  } catch {
    return ""
  }
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

// @desc    Get customer dashboard stats
// @route   GET /api/customer/dashboard
// @access  Customer Only
export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    const [orderStats, wishlistCount, addressCount, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: { customer: customerId } },
        {
          $group: {
            _id: {
              orderStatus: "$orderStatus",
              paymentStatus: "$paymentStatus",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),
      Wishlist.countDocuments({ customer: customerId }),
      Address.countDocuments({ owner: customerId }),
      Order.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber orderStatus totalAmount createdAt items"),
    ]);

    const stats = {
      totalOrders: 0,
      totalSpent: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      wishlistCount,
      addressCount,
    };

    for (const s of orderStats) {
      stats.totalOrders += s.count;
      if (s._id.paymentStatus === "paid") {
        stats.totalSpent += s.totalAmount || 0;
      }
      if (s._id.orderStatus === "Completed") {
        stats.completedOrders += s.count;
      } else if (s._id.orderStatus === "Rejected") {
        stats.cancelledOrders += s.count;
      } else if (["Awaiting response", "Processing", "Ready to ship", "Shipped"].includes(s._id.orderStatus)) {
        stats.activeOrders += s.count;
      }
    }

    return res.status(200).json({
      success: true,
      dashboard: {
        stats,
        recentOrders: recentOrders.map((o) => ({
          id: o.orderNumber || o._id.toString(),
          orderNumber: o.orderNumber,
          status: o.orderStatus,
          totalAmount: o.totalAmount,
          itemCount: o.items?.length || 0,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard.",
    });
  }
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

// @desc    Get customer orders with pagination + filters
// @route   GET /api/customer/orders
// @access  Customer Only
export const getCustomerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { customer: req.user._id };
    const validStatuses = [
      "Awaiting response",
      "Processing",
      "Ready to ship",
      "Shipped",
      "Completed",
      "Rejected",
    ];
    if (status && status !== "all") {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid order status.",
        });
      }
      filter.orderStatus = status;
    }

    const requestedPage = Number(page);
    const requestedLimit = Number(limit);
    if (
      !Number.isInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive whole numbers.",
      });
    }
    const currentPage = requestedPage;
    const pageLimit = Math.min(requestedLimit, 100);
    const skip = (currentPage - 1) * pageLimit;
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
      Order.countDocuments(filter),
    ]);

    const formatted = orders.map((o) => ({
      id: o.orderNumber || o._id.toString(),
      _id: o._id.toString(),
      orderNumber: o.orderNumber,
      status: o.orderStatus,
      totalAmount: o.totalAmount,
      subtotal: o.subtotal,
      shipping: o.shipping,
      paymentStatus: o.paymentStatus,
      source: o.source,
      items: o.items.map((item) => ({
        id: item._id?.toString() || "",
        name: item.name || item.title,
        title: item.title || item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
        category: item.category,
        artisanName: item.artisanName,
        itemStatus: item.itemStatus,
      })),
      shippingAddress: o.shippingAddress,
      note: o.note,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      orders: formatted,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve orders.",
    });
  }
};

// @desc    Get single customer order by ID or order number
// @route   GET /api/customer/orders/:id
// @access  Customer Only
export const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { _id: id, customer: req.user._id }
      : { orderNumber: id, customer: req.user._id };

    const order = await Order.findOne(filter);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order.orderNumber || order._id.toString(),
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shipping: order.shipping,
        paymentStatus: order.paymentStatus,
        source: order.source,
        items: order.items.map((item) => ({
          id: item._id?.toString() || "",
          name: item.name || item.title,
          title: item.title || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          category: item.category,
          artisanName: item.artisanName,
          itemStatus: item.itemStatus,
        })),
        shippingAddress: order.shippingAddress,
        note: order.note,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get order by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order.",
    });
  }
};

// @desc    Cancel a customer order (only if Awaiting response)
// @route   PATCH /api/customer/orders/:id/cancel
// @access  Customer Only
export const cancelCustomerOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { _id: id, customer: req.user._id }
      : { orderNumber: id, customer: req.user._id };

    const order = await Order.findOne(filter);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const cancellableStatuses = ["Awaiting response", "Processing"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = "Rejected";
    order.items = order.items.map((item) => {
      item.itemStatus = "Rejected";
      return item;
    });
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      orderId: order.orderNumber || order._id.toString(),
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order.",
    });
  }
};

// ─────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────

// @desc    Get customer wishlist
// @route   GET /api/customer/wishlist
// @access  Customer Only
export const getCustomerWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ customer: req.user._id })
      .populate({
        path: "product",
        select: "title price images category artisan slug isPublished status",
        populate: { path: "artisan", select: "name city" },
      })
      .sort({ addedAt: -1 });

    const formatted = items
      .filter((item) => item.product) // skip orphaned wishlist items
      .map((item) => {
        const p = item.product;
        return {
          wishlistId: item._id.toString(),
          addedAt: item.addedAt,
          product: {
            id: p._id.toString(),
            _id: p._id.toString(),
            title: p.title,
            price: p.price,
            image: p.image || p.images?.[0] || "",
            category: p.category || "",
            artisanName: p.artisan?.name || "SkillBridge Artisan",
            artisanCity: p.artisan?.city || "",
            slug: p.slug || p._id.toString(),
            isAvailable: p.isPublished || p.status === "Published",
          },
        };
      });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      wishlist: formatted,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve wishlist.",
    });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/customer/wishlist
// @access  Customer Only
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Valid product ID is required." });
    }

    const product = await Product.findOne({
      _id: productId,
      $or: [{ status: "Published" }, { isPublished: true }],
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Published product not found.",
      });
    }

    const existing = await Wishlist.findOne({ customer: req.user._id, product: productId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Product is already in wishlist." });
    }

    const wishlistItem = await Wishlist.create({
      customer: req.user._id,
      product: productId,
      addedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Added to wishlist.",
      wishlistId: wishlistItem._id.toString(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Product already in wishlist." });
    }
    console.error("Add to wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add to wishlist.",
    });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/customer/wishlist/:productId
// @access  Customer Only
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required.",
      });
    }

    const deleted = await Wishlist.findOneAndDelete({
      customer: req.user._id,
      product: productId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Wishlist item not found." });
    }

    return res.status(200).json({ success: true, message: "Removed from wishlist." });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove from wishlist.",
    });
  }
};

// @desc    Check if a product is in wishlist
// @route   GET /api/customer/wishlist/check/:productId
// @access  Customer Only
export const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required.",
      });
    }
    const exists = await Wishlist.exists({
      customer: req.user._id,
      product: productId,
    });
    return res.status(200).json({ success: true, inWishlist: !!exists });
  } catch (error) {
    console.error("Check wishlist status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check wishlist.",
    });
  }
};

// ─────────────────────────────────────────────
// ADDRESSES
// ─────────────────────────────────────────────

// @desc    Get customer saved addresses
// @route   GET /api/customer/addresses
// @access  Customer Only
export const getCustomerAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ owner: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      addresses: addresses.map((a) => a.toSafeObject()),
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve addresses." });
  }
};

// @desc    Add a new address
// @route   POST /api/customer/addresses
// @access  Customer Only
export const addCustomerAddress = async (req, res) => {
  try {
    const { label, fullName, phone, email, address, city, state, postalCode, isDefault } = req.body;

    if (!fullName?.trim() || !address?.trim() || !city?.trim() || !state?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name, address, city, and state are required.",
      });
    }

    // If making default, clear other defaults first
    if (isDefault) {
      await Address.updateMany({ owner: req.user._id }, { $set: { isDefault: false } });
    }

    // If this is the first address, make it default
    const count = await Address.countDocuments({ owner: req.user._id });
    const makeDefault = isDefault || count === 0;

    const newAddress = await Address.create({
      owner: req.user._id,
      label: label || "Home",
      fullName: fullName.trim(),
      phone: phone?.trim() || "",
      email: email?.trim()?.toLowerCase() || "",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode?.trim() || "",
      isDefault: makeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      address: newAddress.toSafeObject(),
    });
  } catch (error) {
    console.error("Add address error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add address." });
  }
};

// @desc    Update an existing address
// @route   PATCH /api/customer/addresses/:id
// @access  Customer Only
export const updateCustomerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, fullName, phone, email, address, city, state, postalCode, isDefault } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid address ID is required." });
    }

    const existing = await Address.findOne({ _id: id, owner: req.user._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    if (isDefault) {
      await Address.updateMany({ owner: req.user._id }, { $set: { isDefault: false } });
    }

    if (label !== undefined) existing.label = label;
    if (fullName?.trim()) existing.fullName = fullName.trim();
    if (phone !== undefined) existing.phone = phone.trim();
    if (email !== undefined) existing.email = email.trim().toLowerCase();
    if (address?.trim()) existing.address = address.trim();
    if (city?.trim()) existing.city = city.trim();
    if (state?.trim()) existing.state = state.trim();
    if (postalCode !== undefined) existing.postalCode = postalCode.trim();
    if (isDefault !== undefined) existing.isDefault = isDefault;

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      address: existing.toSafeObject(),
    });
  } catch (error) {
    console.error("Update address error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update address." });
  }
};

// @desc    Delete an address
// @route   DELETE /api/customer/addresses/:id
// @access  Customer Only
export const deleteCustomerAddress = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Valid address ID is required." });
    }
    const deleted = await Address.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // If deleted address was default, make the most recent one the new default
    if (deleted.isDefault) {
      const next = await Address.findOne({ owner: req.user._id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return res.status(200).json({ success: true, message: "Address deleted." });
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete address." });
  }
};

// @desc    Set an address as default
// @route   PATCH /api/customer/addresses/:id/default
// @access  Customer Only
export const setDefaultAddress = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Valid address ID is required." });
    }
    const address = await Address.findOne({ _id: req.params.id, owner: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    await Address.updateMany({ owner: req.user._id }, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated.",
      address: address.toSafeObject(),
    });
  } catch (error) {
    console.error("Set default address error:", error);
    return res.status(500).json({ success: false, message: "Failed to set default address." });
  }
};
