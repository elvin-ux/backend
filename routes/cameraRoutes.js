const express = require("express");
const router = express.Router();

const {
  getCameras,
  updateCameraStatus,
} = require("../controllers/cameraController");

// Get cameras for a device
router.get("/:deviceId", getCameras);

// Update camera status
router.put("/:id/status", updateCameraStatus);

module.exports = router;
