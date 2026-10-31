import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Shop } from "../models/shop.model.js";

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
    const { items, shippingAddress, subtotal, shipping, total, note } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before placing an order.",
      });
    }

    const orderItems = [];
    for (const item of items) {
      // Find matching product in DB if possible
      let artisanId = item.artisanId;
      if (!artisanId && item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId)) {
        const prod = await Product.findById(item.productId);
        if (prod) artisanId = prod.artisan;
      }

      orderItems.push({
        product: item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId) ? item.productId : null,
        title: item.title || item.name || "Handmade Product",
        name: item.name || item.title || "Handmade Product",
        category: item.category || "Handmade",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || "",
        artisanId: artisanId || customer._id, // fallback
        artisanName: item.artisan || "SkillBridge Artisan",
        itemStatus: "Awaiting response",
      });
    }

    const totalAmount = Number(total) || Number(subtotal) + Number(shipping || 0);

    const order = await Order.create({
      customer: customer._id,
      customerName: shippingAddress?.fullName || customer.name,
      customerEmail: shippingAddress?.email || customer.email,
      customerPhone: shippingAddress?.phone || customer.phone || "",
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress?.fullName || customer.name,
        phone: shippingAddress?.phone || customer.phone || "",
        email: shippingAddress?.email || customer.email,
        address: shippingAddress?.address || "",
        city: shippingAddress?.city || "",
        state: shippingAddress?.state || "",
        postalCode: shippingAddress?.postalCode || "",
        note: note || "",
      },
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      totalAmount,
      paymentStatus: "paid", // or pending depending on payment flow
      orderStatus: "Awaiting response",
      source: "marketplace",
      note: note || "",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: order.orderNumber,
      order,
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

