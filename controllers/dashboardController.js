const Detection = require("../models/Detection");
const Device = require("../models/Device");
const Camera = require("../models/Camera");


/**
 * Get dashboard stats for a specific device
 * GET /api/dashboard/stats/:deviceId
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    // Get device info
    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Camera stats
    const cameras = await Camera.find({ deviceId });
    const cameraCount = cameras.length;
    const activeCameras = cameras.filter(
      (c) => c.status === "connected"
    ).length;

    // Last detected animal
    const lastDetection = await Detection.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .limit(1);

    const lastDetectedAnimal = lastDetection
      ? lastDetection.animal
      : "None";

    // System uptime — approximate from device createdAt
    const createdAtMs = new Date(device.createdAt || device.updatedAt || Date.now()).getTime();
    const uptimeMs = Number.isFinite(createdAtMs)
      ? Math.max(0, Date.now() - createdAtMs)
      : 0;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const systemUptime =
      uptimeHours >= 24
        ? `${Math.floor(uptimeHours / 24)}d ${uptimeHours % 24}h`
        : `${uptimeHours}h`;

    // Last sync time
    const lastSyncTime = device.lastSeen
      ? device.lastSeen.toISOString()
      : device.updatedAt
        ? device.updatedAt.toISOString()
        : "Never";

    // System status
    const systemStatus = device.status || "Online";

    res.json({
      cameraCount,
      activeCameras,
      lastDetectedAnimal,
      systemUptime,
      lastSyncTime,
      systemStatus,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
