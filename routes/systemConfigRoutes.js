const express = require("express");
const router = express.Router();
const {
  getSystemConfig,
  updateThreshold,
} = require("../controllers/systemConfigController");
const adminAuth = require("../middleware/adminAuth");
const { addThreshold } = require("../controllers/systemConfigController");

router.post("/threshold", adminAuth, addThreshold);

router.get("/", adminAuth, getSystemConfig);
router.put("/threshold", adminAuth, updateThreshold);

module.exports = router;
