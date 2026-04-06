const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
{
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },

  activationCode: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: "Not Assigned",
  },

   name: {
    type: String,
    default: "",
  },

  email: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    default: "",
  },

  location: {
    type: String,
    default: "",
  },

  password: {
    type: String,
    default: "",
  },

  isActivated: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
  },

  monitoringEnabled: {
    type: Boolean,
    default: true,
  },

  fcmToken: {
    type: String,
    default: "",
  }

},
{ timestamps: true }
);

module.exports = mongoose.models.Device || mongoose.model("Device", deviceSchema);