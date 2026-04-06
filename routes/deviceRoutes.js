const express = require("express");
const router = express.Router();

const {
  registerDevice,
  getAllDevices,
  releaseDevice,
} = require("../controllers/deviceController");

// Register device
router.post("/register", registerDevice);

// Get all devices
router.get("/", getAllDevices);

// Release device
router.put("/release/:id", releaseDevice);

const { toggleMonitoring } = require("../controllers/deviceController");

// Toggle monitoring
router.put("/toggle-monitoring/:id", toggleMonitoring);

const {
  login,
  updateProfile,
  getProfile
} = require("../controllers/mobileAuthController");

const {
  changePassword
} = require("../controllers/changePasswordController");

// 🔐 Mobile Login
router.post("/login", login);

// 👤 Update Profile
router.put("/update-profile", updateProfile);

// 📄 Get Profile
router.get("/profile/:id", getProfile);

// 🔑 Change Password
router.post("/change-password", changePassword);

module.exports = router;
