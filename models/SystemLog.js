const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    source: {
      type: String, // device, admin, auth, system
      default: "system",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemLog", systemLogSchema);
