const mongoose = require("mongoose");

const thresholdSchema = new mongoose.Schema({
  animal: { type: String, required: true, unique: true },
  threshold: { type: Number, required: true }, // 0.5 – 0.99
});

const systemConfigSchema = new mongoose.Schema(
  {
    thresholds: [thresholdSchema],
    activeModel: {
      name: String,
      version: String,
      uploadedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
