const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    animal: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
    },

    sensorTriggered: {
      type: Boolean,
    },

    imageUrl: {
      type: String,
    },

    detectionSource: {
      type: String,
      enum: ["ml", "sensor", "combined"],
    },

    // NEW: risk classification
    riskLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Investigating", "Resolved"],
      default: "Pending",
    },

    notes: {
      type: String,
      default: "",
    },

    // Officer investigation note — triggers farmer notification when set
    officerNote: {
      type: String,
      default: "",
    },

    // Track if detection has been viewed
    viewed: {
      type: Boolean,
      default: false,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for fast per-device queries sorted by latest first
detectionSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model("Detection", detectionSchema);