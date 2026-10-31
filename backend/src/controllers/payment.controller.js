import crypto from "crypto";
import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { getRazorpayInstance, getRazorpayKeyId } from "../config/razorpay.js";

/**
 * @desc    Get public Razorpay Key ID for client Checkout
 * @route   GET /api/payment/config
 * @access  Customer Only
 */
export const getRazorpayConfig = async (req, res) => {
  try {
    const keyId = getRazorpayKeyId();
    if (!keyId) {
      return res.status(500).json({
        success: false,
        message: "Razorpay Key ID is not configured on the server.",
      });
    }

    return res.status(200).json({
      success: true,
      keyId,
    });
  } catch (error) {
    console.error("Get Razorpay config error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load payment configuration.",
    });
  }
};

/**
 * @desc    Create Razorpay Order with securely calculated amounts
 * @route   POST /api/payment/create-order
 * @access  Customer Only
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const customer = req.user;
    const { items, shippingAddress, note, existingOrderId } = req.body;
    const razorpay = getRazorpayInstance();

    let order = null;
    let totalAmount = 0;

    // Case 1: Retrying payment on an existing pending order
    if (existingOrderId) {
      const query = mongoose.Types.ObjectId.isValid(existingOrderId)
        ? { _id: existingOrderId, customer: customer._id }
        : { orderNumber: existingOrderId, customer: customer._id };

      order = await Order.findOne(query);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found or does not belong to your account.",
        });
      }

      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "This order has already been paid for.",
        });
      }

      totalAmount = order.totalAmount;
    } else {
      // Case 2: Checkout bag -> validate items, calculate total from trusted DB data
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Your bag is empty. Please add items before proceeding to checkout.",
        });
      }
      if (items.length > 50) {
        return res.status(400).json({
          success: false,
          message: "An order cannot contain more than 50 items.",
        });
      }

      // Validate shipping address
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

      // Aggregate item quantities
      const quantitiesByProduct = new Map();
      for (const item of items) {
        const productId = item?.productId || item?.id || item?._id;
        const quantity = Number(item?.quantity);
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({
            success: false,
            message: "A product in your bag is not a valid catalog product.",
          });
        }
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
          return res.status(400).json({
            success: false,
            message: "Each product quantity must be an integer between 1 and 99.",
          });
        }
        quantitiesByProduct.set(
          productId,
          (quantitiesByProduct.get(productId) || 0) + quantity
        );
      }

      // Fetch trusted product records from MongoDB (NEVER trust frontend prices!)
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
            message: `"${product.title}" has only ${product.stock} item(s) available in stock.`,
          });
        }
        if (!product.artisan?._id) {
          return res.status(409).json({
            success: false,
            message: `"${product.title}" is currently not available for ordering.`,
          });
        }

        orderItems.push({
          product: product._id,
          title: product.title,
          name: product.title,
          category: product.category,
          price: product.price, // Trusted price from database!
          quantity,
          image: product.image || product.images?.[0] || "",
          artisanId: product.artisan._id,
          artisanName: product.artisan.name || "SkillBridge Artisan",
          itemStatus: "Awaiting response",
        });
      }

      const calculatedSubtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const calculatedShipping = calculatedSubtotal >= 1500 ? 0 : 99;
      totalAmount = calculatedSubtotal + calculatedShipping;

      // Create Order in MongoDB with pending status
      order = await Order.create({
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
    }

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay Order
    const razorpayOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: (order.orderNumber || order._id.toString()).slice(-40),
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail || customer.email,
      },
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error("Failed to initialize Razorpay payment order.");
    }

    // Save razorpayOrderId to MongoDB Order
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment order initialized successfully.",
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      keyId: getRazorpayKeyId(),
      order: {
        id: order.orderNumber || order._id.toString(),
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shipping: order.shipping,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        items: order.items,
        customer: order.shippingAddress,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order.",
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature and capture payment
 * @route   POST /api/payment/verify
 * @access  Customer Only
 */
export const verifyPayment = async (req, res) => {
  try {
    const customer = req.user;
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment credentials received for verification.",
      });
    }

    // Locate the matching order in MongoDB
    let order = null;
    if (orderId) {
      const query = mongoose.Types.ObjectId.isValid(orderId)
        ? { _id: orderId, customer: customer._id }
        : { orderNumber: orderId, customer: customer._id };
      order = await Order.findOne(query);
    }
    if (!order && razorpay_order_id) {
      order = await Order.findOne({
        razorpayOrderId: razorpay_order_id,
        customer: customer._id,
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or does not belong to your account.",
      });
    }

    // Check for duplicate payment processing
    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "This order has already been verified and marked as paid.",
        order: {
          id: order.orderNumber || order._id.toString(),
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          razorpayPaymentId: order.razorpayPaymentId,
          total: order.totalAmount,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          shipping: order.shipping,
          items: order.items,
          customer: order.shippingAddress,
        },
      });
    }

    // Verify payment signature using HMAC SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay API secret is not configured on the server.");
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      order.paymentStatus = "failed";
      order.paymentError = "Payment signature verification failed.";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment verification failed.",
      });
    }

    // Fetch verified payment details from Razorpay SDK
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment) {
      throw new Error("Payment record could not be fetched from Razorpay.");
    }

    // Verify payment amounts match trusted order amount
    const expectedPaise = Math.round(order.totalAmount * 100);
    if (payment.amount !== expectedPaise) {
      order.paymentStatus = "failed";
      order.paymentError = `Amount mismatch: expected ${expectedPaise} paise, received ${payment.amount} paise.`;
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment amount does not match the order total.",
      });
    }

    // Verify payment status is authorized or captured
    const validStatuses = ["captured", "authorized"];
    if (!validStatuses.includes(payment.status)) {
      order.paymentStatus = "failed";
      order.paymentError = `Unexpected payment status: ${payment.status}`;
      await order.save();

      return res.status(400).json({
        success: false,
        message: `Payment is in ${payment.status} status and cannot be verified.`,
      });
    }

    // If authorized, capture it
    if (payment.status === "authorized") {
      try {
        await razorpay.payments.capture(
          razorpay_payment_id,
          expectedPaise,
          "INR"
        );
      } catch (captureErr) {
        console.warn("Payment auto-capture note:", captureErr.message);
      }
    }

    // Update MongoDB Order as successfully paid
    order.paymentStatus = "paid";
    order.orderStatus = "Processing";
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentMethod = payment.method || "razorpay";
    order.paymentError = "";
    order.paidAt = new Date();

    // Mark item status as Processing
    for (const item of order.items) {
      item.itemStatus = "Processing";
    }

    await order.save();

    // Decrement stock for purchased items
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }).catch((err) => {
          console.warn("Stock update error for product:", item.product, err.message);
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Your order is confirmed!",
      order: {
        id: order.orderNumber || order._id.toString(),
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        razorpayPaymentId: order.razorpayPaymentId,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        total: order.totalAmount,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shipping: order.shipping,
        items: order.items.map((i) => ({
          id: i._id ? i._id.toString() : "",
          name: i.name || i.title,
          title: i.title || i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          artisan: i.artisanName,
          artisanName: i.artisanName,
          category: i.category,
          itemStatus: i.itemStatus,
        })),
        customer: order.shippingAddress,
        shippingAddress: order.shippingAddress,
        note: order.note,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed.",
    });
  }
};

/**
 * @desc    Handle payment failure or user cancellation
 * @route   POST /api/payment/failed
 * @access  Customer Only
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const customer = req.user;
    const { orderId, razorpay_order_id, error } = req.body;

    let order = null;
    if (orderId) {
      const query = mongoose.Types.ObjectId.isValid(orderId)
        ? { _id: orderId, customer: customer._id }
        : { orderNumber: orderId, customer: customer._id };
      order = await Order.findOne(query);
    }
    if (!order && razorpay_order_id) {
      order = await Order.findOne({
        razorpayOrderId: razorpay_order_id,
        customer: customer._id,
      });
    }

    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "failed";
      order.paymentError =
        error?.description ||
        error?.message ||
        "Payment cancelled or declined by user.";
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment status recorded as failed.",
    });
  } catch (err) {
    console.error("Payment failure handler error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to record payment failure.",
    });
  }
};

