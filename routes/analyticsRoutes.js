const express = require("express");
const router = express.Router();

const {
  getAnalyticsSummary,
  getDetectionHistory,
  getAnimalFrequency,
  getRiskDistribution
} = require("../controllers/analyticsController");


// summary analytics
router.get("/summary/:deviceId", getAnalyticsSummary);


// detection history
router.get("/history/:deviceId", getDetectionHistory);


// animal frequency
router.get("/animals/:deviceId", getAnimalFrequency);


// risk distribution
router.get("/risks/:deviceId", getRiskDistribution);

const {
  getGlobalAnalyticsSummary,
  getGlobalDetectionHistory,
  getGlobalAnimalFrequency,
  getGlobalRiskDistribution
} = require("../controllers/analyticsController");

// Global endpoints for Officer Dashboard
router.get("/global/summary", getGlobalAnalyticsSummary);
router.get("/global/history", getGlobalDetectionHistory);
router.get("/global/animals", getGlobalAnimalFrequency);
router.get("/global/risks", getGlobalRiskDistribution);
// /global/time route removed — hourly heatmap no longer used

module.exports = router;