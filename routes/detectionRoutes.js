const express = require("express");
const router = express.Router();

const {
  createDetection,
  getDeviceDetections,
  deleteDetection,
} = require("../controllers/detectionController");

const deviceAuth = require("../middleware/deviceAuth");
const uploadDetectionImage = require("../config/uploadDetectionImage");


// device sends detection + image
router.post(
  "/",
  deviceAuth,
  uploadDetectionImage.single("image"),
  createDetection
);


// mobile app fetch detections
router.get("/:deviceId", getDeviceDetections);


// delete detection
router.delete("/:id", deleteDetection);


module.exports = router;