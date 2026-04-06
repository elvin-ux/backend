const Device = require("../models/Device");

const deviceAuth = async (req, res, next) => {
  try {
    const rawDeviceId = req.headers["device-id"];
    const deviceId = rawDeviceId ? rawDeviceId.toUpperCase() : null;

    if (!deviceId) {
      return res.status(401).json({
        message: "Device ID missing",
      });
    }

    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(403).json({
        message: "Device not registered",
      });
    }

    if (!device.isActivated) {
      return res.status(403).json({
        message: "Device not activated",
      });
    }

    if (device.status !== "Assigned") {
      return res.status(403).json({
        message: "Device not assigned",
      });
    }

    req.device = device;

    next();
  } catch (error) {
    res.status(500).json({
      message: "Device authentication failed",
    });
  }
};

module.exports = deviceAuth;