const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const SystemLog = require("../models/SystemLog");

// Get logs with optional filter
router.get("/", adminAuth, async (req, res) => {
  const { type } = req.query;

  const query = type ? { type } : {};
  const logs = await SystemLog.find(query)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
});

module.exports = router;
