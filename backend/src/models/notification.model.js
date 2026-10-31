import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "ORDER_ACCEPTED",
        "ORDER_REJECTED",
        "ORDER_STATUS_UPDATED",
        "PROJECT_ASSIGNED",
        "PROJECT_ACCEPTED",
        "PROJECT_APPLIED",
        "PROJECT_COMPLETED",
        "PAYMENT_RECEIVED",
        "PAYMENT_COMPLETED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    recipient: this.recipient ? this.recipient.toString() : null,
    sender: this.sender
      ? typeof this.sender === "object" && this.sender.name
        ? {
            id: this.sender._id.toString(),
            name: this.sender.name,
            email: this.sender.email,
            avatar: this.sender.avatar,
          }
        : this.sender.toString()
      : null,
    type: this.type,
    title: this.title,
    message: this.message,
    orderId: this.orderId ? this.orderId.toString() : null,
    projectId: this.projectId ? this.projectId.toString() : null,
    isRead: this.isRead,
    readAt: this.readAt,
    metadata: this.metadata || {},
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Notification = mongoose.model("Notification", notificationSchema);
