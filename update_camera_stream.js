require("dotenv").config();

const connectDB = require("./config/db");
const Camera = require("./models/Camera");

async function updateCameraStream() {
  const deviceId = (process.env.DEVICE_ID || "DEV-001").toUpperCase();
  const cameraId = (process.env.CAMERA_ID || "CAM-001").toUpperCase();
  const streamUrl = process.env.CAMERA_STREAM_URL;

  if (!streamUrl) {
    throw new Error("Set CAMERA_STREAM_URL to your current Cloudflare /device001/whep URL");
  }

  await connectDB();

  const camera = await Camera.findOneAndUpdate(
    { deviceId, cameraId },
    { streamUrl: streamUrl.trim(), status: "connected" },
    { new: true }
  );

  if (!camera) {
    throw new Error(`Camera not found for ${deviceId}/${cameraId}`);
  }

  console.log("Camera stream URL updated:");
  console.log({
    deviceId: camera.deviceId,
    cameraId: camera.cameraId,
    name: camera.name,
    status: camera.status,
    streamUrl: camera.streamUrl,
  });

  process.exit(0);
}

updateCameraStream().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
