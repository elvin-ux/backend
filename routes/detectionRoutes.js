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
  (req, res, next) => {
    uploadDetectionImage.single("image")(req, res, (err) => {
      if (err) {
        console.error("🚨 IMAGE UPLOAD ERROR:", err);
        return res.status(500).json({ 
          message: "Image upload to Cloudinary failed", 
          error: err.message || err 
        });
      }
      next();
    });
  },
  createDetection
);


// mobile app fetch detections
router.get("/:deviceId", getDeviceDetections);


// delete detection
router.delete("/:id", deleteDetection);


module.exports = router;