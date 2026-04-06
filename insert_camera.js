const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Camera = require("./models/Camera");

async function insertCamera() {
  require("dotenv").config();
  await connectDB();
  console.log("DB connected");

  const deviceId = "DEV-001";
  
  const existing = await Camera.findOne({ deviceId });
  if (!existing) {
    const newCamera = new Camera({
      deviceId: "DEV-001",
      cameraId: "CAM-001",
      name: "Crop Field Feed",
      status: "connected",
      streamUrl: "https://original-status-alive-acre.trycloudflare.com/device001/whep",
      location: "South Sector"
    });
    await newCamera.save();
    console.log("Inserted new Camera!");
  } else {
    // Ensure it's connected and update name/location
    existing.status = "connected";
    existing.name = "Crop Field Feed";
    existing.location = "South Sector";
    await existing.save();
    console.log("Camera already existed, updated name, location, and marked as connected.");
  }

  process.exit(0);
}

insertCamera().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
