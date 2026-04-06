const mongoose = require("mongoose");
const Device = require("./models/Device");
const { sendPushNotification } = require("./utils/firebaseService");
require("dotenv").config();

async function testPush() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/farm_protection");
    console.log("Connected to MongoDB");

    const device = await Device.findOne({ fcmToken: { $exists: true, $ne: "" } }).sort({ updatedAt: -1 });
    
    if (!device) {
      console.log("⛔ No device with an FCM token found. Please log into the Flutter app first so it saves your token to the database.");
      process.exit(1);
    }

    console.log(`✅ Found Device: ${device.deviceId}`);
    console.log("🚀 Sending Test Push Notification...");
    
    const success = await sendPushNotification(
      device.fcmToken,
      "System Test Alert",
      "This is a direct test from the server. If this slides down in a banner, the architecture is perfect!",
      { type: "test" }
    );

    console.log(success ? "🟢 Firing successful! Check your phone." : "🔴 Failed to send FCM.");
  } catch (error) {
    console.error("Error testing push:", error);
  } finally {
    mongoose.disconnect();
  }
}

testPush();
