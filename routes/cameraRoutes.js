const express = require("express");
const router = express.Router();

const {
  getCameras,
  updateCameraStatus,
  updateCameraStreamUrl,
} = require("../controllers/cameraController");

// Get cameras for a device
router.get("/:deviceId", getCameras);

// Update camera stream URL
router.put("/:deviceId/:cameraId/stream", updateCameraStreamUrl);

// Update camera status
router.put("/:id/status", updateCameraStatus);

module.exports = router;
