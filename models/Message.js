const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String, // Farm ID
      required: true,
    },
    senderId: {
      // Officer ID or 'System'
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["officer", "farmer"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
