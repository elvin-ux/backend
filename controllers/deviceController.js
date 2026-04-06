const Device = require("../models/Device");
const {
  logInfo,
  logWarning,
  logError,
} = require("../utils/systemLogger");

/**
 * Register a new device
 */
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, activationCode } = req.body;

    // Validation
    if (!deviceId || !activationCode) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check if device already exists
    const exists = await Device.findOne({ deviceId });
    if (exists) {
      return res.status(409).json({ message: "Device already exists" });
    }

    // Create device
    const device = await Device.create({
      deviceId,
      activationCode,
      status: "Not Assigned",
      assignedUser: null,
    });

    // ✅ LOG: Successful registration
    await logInfo(`Device registered: ${deviceId}`, "device");

    res.status(201).json({
      message: "Device registered successfully",
      device,
    });
  } catch (err) {
    console.error("Register device error:", err);

    // ❌ LOG: Registration failure
    await logError("Device registration failed", "device");

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all registered devices
 */
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    console.error("Fetch devices error:", error);

    // ❌ LOG: Fetch failure
    await logError("Failed to fetch devices", "device");

    res.status(500).json({ message: "Failed to fetch devices" });
  }
};

/**
 * Release a device (unassign from user)
 */
exports.releaseDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        status: "Not Assigned",
        assignedUser: null,
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // ⚠️ LOG: Device released
    await logWarning(`Device released: ${device.deviceId}`, "device");

    res.json({
      message: "Device released successfully",
      device,
    });
  } catch (error) {
    console.error("Release device error:", error);

    // ❌ LOG: Release failure
    await logError("Failed to release device", "device");

    res.status(500).json({ message: "Failed to release device" });
  }
};

/**
 * Toggle monitoring status for a device
 */
exports.toggleMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({ message: "enabled field is required" });
    }

    const device = await Device.findByIdAndUpdate(
      id,
      { monitoringEnabled: enabled },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    await logInfo(`Device monitoring toggled to ${enabled}: ${device.deviceId}`, "device");

    const io = req.app.get("io");
    if (io) {
      io.emit("monitoring_changed", { deviceId: device.deviceId, enabled });
    }

    res.json({
      message: `Monitoring ${enabled ? 'enabled' : 'disabled'} successfully`,
      device,
    });
  } catch (error) {
    console.error("Toggle monitoring error:", error);
    await logError("Failed to toggle device monitoring", "device");
    res.status(500).json({ message: "Failed to toggle device monitoring" });
  }
};
