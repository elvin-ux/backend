const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const deviceAuth = require("../middleware/deviceAuth");

router.get("/:filename", deviceAuth, (req, res) => {
  try {
    const filename = req.params.filename;

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "detections",
      filename
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: "Image access failed" });
  }
});

module.exports = router;