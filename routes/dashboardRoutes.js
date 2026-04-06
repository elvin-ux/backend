const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

// Dashboard stats
router.get("/stats/:deviceId", getDashboardStats);

module.exports = router;
