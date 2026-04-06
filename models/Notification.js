const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["detection", "camera", "system", "alert_status", "officer_note", "chat"],
      default: "detection",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    detectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Detection",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast per-device unread queries
notificationSchema.index({ deviceId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
