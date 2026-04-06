const express = require("express");
const router = express.Router();

const {
  login,
  updateProfile,
  changePassword,
  getProfile,
  updateFcmToken,
} = require("../controllers/mobileAuthController");

// 🔐 Login
router.post("/login", login);

// 👤 Update Profile
router.put("/update-profile", updateProfile);

// 🔑 Change Password
router.post("/change-password", changePassword);

// 📄 Get Profile
router.get("/profile/:id", getProfile);

// 🔔 Update FCM Token (called on token refresh)
router.post("/update-fcm-token", updateFcmToken);

module.exports = router;

