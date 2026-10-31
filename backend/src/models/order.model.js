import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Handmade",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    image: {
      type: String,
      default: "",
    },
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    artisanName: {
      type: String,
      default: "",
    },
    itemStatus: {
      type: String,
      enum: [
        "Awaiting response",
        "Processing",
        "Ready to ship",
        "Shipped",
        "Completed",
        "Rejected",
      ],
      default: "Awaiting response",
    },
  },
  { _id: true }
);

orderItemSchema.pre("save", function () {
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.title && this.name) {
    this.title = this.name;
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
      note: { type: String, trim: true, default: "" },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: "razorpay",
    },
    paymentError: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: [
        "Awaiting response",
        "Processing",
        "Ready to ship",
        "Shipped",
        "Completed",
        "Rejected",
      ],
      default: "Awaiting response",
      index: true,
    },
    source: {
      type: String,
      enum: ["marketplace", "industry"],
      default: "marketplace",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    deadline: {
      type: String,
      default: "",
    },
    specifications: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function () {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
});

// Format order specifically for an artisan
orderSchema.methods.toArtisanOrder = function (artisanId) {
  const targetId = artisanId.toString();
  const artisanItems = this.items.filter(
    (item) => item.artisanId && item.artisanId.toString() === targetId
  );

  const artisanSubtotal = artisanItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Status for this artisan (first item status, or fallback to overall orderStatus)
  const artisanStatus =
    (artisanItems[0] && artisanItems[0].itemStatus) || this.orderStatus;

  const addr = this.shippingAddress || {};

  return {
    id: this.orderNumber || this._id.toString(),
    _id: this._id.toString(),
    orderNumber: this.orderNumber || this._id.toString(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    source: this.source || "marketplace",
    status: artisanStatus,
    items: artisanItems.map((item) => ({
      id: item._id ? item._id.toString() : "",
      productId: item.product ? item.product.toString() : "",
      name: item.name || item.title,
      title: item.title || item.name,
      category: item.category || "Handmade",
      price: item.price,
      quantity: item.quantity,
      image: item.image || "",
    })),
    subtotal: artisanSubtotal,
    customer: {
      fullName: addr.fullName || this.customerName || "Customer",
      email: addr.email || this.customerEmail || "",
      phone: addr.phone || this.customerPhone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      note: addr.note || this.note || "",
    },
    paymentStatus: this.paymentStatus,
    razorpayPaymentId: this.razorpayPaymentId || "",
    paidAt: this.paidAt || null,
    specifications: this.specifications || "",
    deadline: this.deadline || "",
  };
};

export const Order = mongoose.model("Order", orderSchema);
