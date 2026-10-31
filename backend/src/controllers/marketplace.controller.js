import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Shop } from "../models/shop.model.js";
import mongoose from "mongoose";

// @desc    Get published marketplace products (Customer only)
// @route   GET /api/marketplace/products
// @access  Customer Only
export const getMarketplaceProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {
      $or: [{ status: "Published" }, { isPublished: true }],
    };

    if (category && category !== "All crafts") {
      filter.category = category;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$and = [
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
          ],
        },
      ];
    }

    const products = await Product.find(filter)
      .populate("artisan", "name city state")
      .populate("shop", "name location")
      .sort({ createdAt: -1 });

    const formatted = products.map((product) => {
      const artisanName = product.artisan?.name || "SkillBridge Artisan";
      const location = product.shop?.location || product.artisan?.city || "India";
      return product.toSafeObject(artisanName, location);
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      products: formatted,
    });
  } catch (error) {
    console.error("Marketplace fetch error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve marketplace products.",
    });
  }
};

// @desc    Get single marketplace product by ID or slug (Customer only)
// @route   GET /api/marketplace/products/:id
// @access  Customer Only
export const getMarketplaceProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { _id: id } : { slug: id };

    const product = await Product.findOne(filter)
      .populate("artisan", "name city state bio")
      .populate("shop", "name description location");

    if (!product || (!product.isPublished && product.status !== "Published")) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently not available in the marketplace.",
      });
    }

    const artisanName = product.artisan?.name || "SkillBridge Artisan";
    const location = product.shop?.location || product.artisan?.city || "India";

    return res.status(200).json({
      success: true,
      product: product.toSafeObject(artisanName, location),
    });
  } catch (error) {
    console.error("Get product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve product details.",
    });
  }
};

// @desc    Create a new customer order from marketplace checkout (Customer only)
// @route   POST /api/marketplace/orders
// @access  Customer Only
export const createMarketplaceOrder = async (req, res) => {
  try {
    const customer = req.user;
    const { items, shippingAddress, note } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before placing an order.",
      });
    }
    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "An order cannot contain more than 50 products.",
      });
    }

    const requiredAddressFields = [
      "fullName",
      "phone",
      "email",
      "address",
      "city",
      "state",
      "postalCode",
    ];
    const normalizedAddress = {};
    for (const field of requiredAddressFields) {
      const value = shippingAddress?.[field];
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `A valid ${field} is required for delivery.`,
        });
      }
      normalizedAddress[field] = value.trim();
    }

    const quantitiesByProduct = new Map();
    for (const item of items) {
      const productId = item?.productId;
      const quantity = Number(item?.quantity);
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Your bag contains a product that is not available for online checkout.",
        });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({
          success: false,
          message: "Each product quantity must be between 1 and 99.",
        });
      }
      quantitiesByProduct.set(
        productId,
        (quantitiesByProduct.get(productId) || 0) + quantity,
      );
    }

    const orderItems = [];
    for (const [productId, quantity] of quantitiesByProduct) {
      const product = await Product.findOne({
        _id: productId,
        $or: [{ status: "Published" }, { isPublished: true }],
      })
        .populate("artisan", "name")
        .populate("shop", "location");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "A product in your bag is no longer available.",
        });
      }
      if (product.stock < quantity) {
        return res.status(409).json({
          success: false,
          message: `${product.title} has only ${product.stock} item(s) available.`,
        });
      }
      if (!product.artisan?._id) {
        return res.status(409).json({
          success: false,
          message: `${product.title} is not available for ordering right now.`,
        });
      }

      orderItems.push({
        product: product._id,
        title: product.title,
        name: product.title,
        category: product.category,
        price: product.price,
        quantity,
        image: product.image || product.images?.[0] || "",
        artisanId: product.artisan._id,
        artisanName: product.artisan.name || "SkillBridge Artisan",
        itemStatus: "Awaiting response",
      });
    }

    const calculatedSubtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const calculatedShipping = calculatedSubtotal >= 1500 ? 0 : 99;
    const totalAmount = calculatedSubtotal + calculatedShipping;

    const order = await Order.create({
      customer: customer._id,
      customerName: normalizedAddress.fullName,
      customerEmail: normalizedAddress.email,
      customerPhone: normalizedAddress.phone,
      items: orderItems,
      shippingAddress: {
        ...normalizedAddress,
        note: typeof note === "string" ? note.trim() : "",
      },
      subtotal: calculatedSubtotal,
      shipping: calculatedShipping,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "Awaiting response",
      source: "marketplace",
      note: typeof note === "string" ? note.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: order.orderNumber,
      order: {
        id: order.orderNumber || order._id.toString(),
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.totalAmount,
        paymentStatus: order.paymentStatus,
        source: order.source,
        items: order.items.map((item) => ({
          id: item._id.toString(),
          productId: item.product.toString(),
          name: item.name,
          title: item.title,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          artisan: item.artisanName,
          artisanName: item.artisanName,
          itemStatus: item.itemStatus,
        })),
        customer: normalizedAddress,
        shippingAddress: order.shippingAddress,
        note: order.note,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order.",
    });
  }
};

// @desc    Get customer's past orders (Customer only)
// @route   GET /api/marketplace/orders
// @access  Customer Only
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve your order history.",
    });
  }
};
