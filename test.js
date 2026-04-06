const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Device = require("./models/Device");
const Camera = require("./models/Camera");
const Detection = require("./models/Detection");

async function runTest() {
  require("dotenv").config();
  await connectDB();
  console.log("DB connected");

  const deviceId = "DEV-001";
  
  console.log("Testing Device.findOne");
  const device = await Device.findOne({ deviceId });
  console.log("Device:", device ? device.deviceId : "Not found");

  console.log("Testing Camera.find");
  const cameras = await Camera.find({ deviceId });
  console.log("Cameras count:", cameras.length);

  console.log("Testing Detection.find (limit 5)");
  const detections = await Detection.find({ deviceId }).sort({ timestamp: -1 }).limit(5);
  const path = require("path");
  const fs = require("fs");
  
  detections.forEach(d => {
    console.log(`- Animal: ${d.animal}, ImageUrl: ${d.imageUrl}`);
    if (d.imageUrl) {
      const filename = d.imageUrl.split('/').last || d.imageUrl.split('/').pop();
      const filePath = path.join(__dirname, "uploads", "detections", filename);
      console.log(`  File exists: ${fs.existsSync(filePath)} (${filePath})`);
    }
  });

  process.exit(0);
}

runTest().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
