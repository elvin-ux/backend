const mongoose = require("mongoose");

const forestOfficerSchema = new mongoose.Schema(
  {
    officerId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    fcmToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ForestOfficer", forestOfficerSchema);
