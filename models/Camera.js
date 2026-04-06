const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    cameraId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "disconnected",
    },

    streamUrl: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for per-device camera queries
cameraSchema.index({ deviceId: 1, cameraId: 1 });

module.exports = mongoose.model("Camera", cameraSchema);
