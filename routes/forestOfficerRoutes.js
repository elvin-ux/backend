const express = require("express");
const router = express.Router();
const {
  registerOfficer,
  getOfficers,
  getDashboardStats,
  getAlerts,
  updateAlert,
  getInsights,
  getFarms
} = require("../controllers/forestOfficerController");
const adminAuth = require("../middleware/adminAuth");

router.post("/register", adminAuth, registerOfficer);
router.get("/", adminAuth, getOfficers);

// Mobile App Endpoints (no admin token required for simplified mobile auth)
router.get("/dashboard", getDashboardStats);
router.get("/alerts", getAlerts);
router.put("/alerts/:id", updateAlert);
router.get("/insights", getInsights);
router.get("/farms", getFarms);

module.exports = router;
