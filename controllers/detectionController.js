const Detection = require("../models/Detection");
const Device = require("../models/Device");
const Notification = require("../models/Notification");
const { logInfo, logError } = require("../utils/systemLogger");

/**
 * Animal risk classification helper
 */
function classifyRisk(animal) {
  const highRisk = ["elephant", "tiger", "leopard"];
  const mediumRisk = ["bear", "boar", "wild boar", "monkey"];
  const lowRisk = ["person", "cat", "deer", "dog"];

  const a = animal.toLowerCase();

  if (highRisk.includes(a)) return "high";
  if (mediumRisk.includes(a)) return "medium";
  if (lowRisk.includes(a)) return "low";

  return "low";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/**
 * Create a new detection event from an edge device
 */
exports.createDetection = async (req, res) => {
  try {

    const {
      animal,
      confidence,
      sensorTriggered,
      detectionSource,
    } = req.body;

    const deviceId = req.device.deviceId;

    const sensorTriggeredBool =
      sensorTriggered === "true" || sensorTriggered === true;

    const imageUrl = req.file ? req.file.path : "";

    if (!animal) {
      return res.status(400).json({
        message: "animal is required",
      });
    }

    const riskLevel = classifyRisk(animal);

    const detection = await Detection.create({
      deviceId,
      animal,
      confidence,
      sensorTriggered: sensorTriggeredBool,
      imageUrl,
      detectionSource,
      riskLevel,
    });

    console.log(
      "Detection saved:",
      detection.animal,
      "Device:",
      deviceId
    );

    // SOCKET EMIT
    const io = req.app.get("io");

    if (io) {
      io.emit("new_detection", detection);
    }

    // AUTO-CREATE NOTIFICATION
    try {
      const notification = await Notification.create({
        deviceId,
        type: "detection",
        title: `${animal} Detected`,
        message: `${riskLevel.toUpperCase()} risk — ${animal} detected with ${Math.round(confidence * 100)}% confidence`,
        detectionId: detection._id,
      });

      // SEND PUSH NOTIFICATION
      const { sendPushNotification } = require("../utils/firebaseService");
      
      const targetDevice = await Device.findOne({ deviceId });
      if (targetDevice && targetDevice.fcmToken) {
        await sendPushNotification(
          targetDevice.fcmToken,
          `${animal} Detected`,
          `${riskLevel.toUpperCase()} risk — ${animal} detected with ${Math.round(confidence * 100)}% confidence`,
          { detectionId: detection._id.toString() }
        );
      }

      if (io) {
        io.emit("new_notification", {
          id: notification._id,
          deviceId: notification.deviceId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          detectionId: notification.detectionId,
          read: notification.read,
          createdAt: notification.createdAt,
        });
      }
    } catch (notifErr) {
      console.error("Notification creation error:", notifErr);
    }

    await logInfo(
      `Detection recorded: ${animal} on device ${deviceId}`,
      "detection"
    );

    res.status(201).json({
      message: "Detection recorded successfully",
      detection: {
        id: detection._id,
        animal: detection.animal,
        confidence: detection.confidence,
        riskLevel: detection.riskLevel,
        deviceId: detection.deviceId,
        imageUrl: detection.imageUrl,
        sensorTriggered: detection.sensorTriggered,
        detectionSource: detection.detectionSource,
        timestamp: detection.timestamp || detection.createdAt,
      },
    });

  } catch (err) {

    console.error("Create detection error:", err);

    await logError("Failed to create detection", "detection");

    res.status(500).json({
      message: "Server error",
    });

  }
};


/**
 * Get detections for a specific device
 */
exports.getDeviceDetections = async (req, res) => {
  try {

    const { deviceId } = req.params;

    const { sort, riskLevel, animal } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        message: "deviceId is required",
      });
    }

    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    let sortOption = { timestamp: -1 };

    if (sort === "oldest") sortOption = { timestamp: 1 };
    if (sort === "confidence") sortOption = { confidence: -1 };
    if (sort === "animal") sortOption = { animal: 1 };

    const query = { deviceId };
    if (riskLevel) query.riskLevel = riskLevel;
    if (animal) query.animal = new RegExp(`^${escapeRegex(animal)}$`, "i");

    const detections = await Detection.find(query)
      .sort(sortOption);

    const formattedDetections = detections.map((d) => ({
      id: d._id,
      animal: d.animal,
      confidence: d.confidence,
      riskLevel: d.riskLevel || classifyRisk(d.animal),
      deviceId: d.deviceId,
      imageUrl: d.imageUrl,
      sensorTriggered: d.sensorTriggered,
      detectionSource: d.detectionSource,
      timestamp: d.timestamp || d.createdAt,
      status: d.status || 'Pending',
      officerNote: d.officerNote || '',
    }));

    res.json(formattedDetections);

  } catch (err) {

    console.error("Fetch detections error:", err);

    await logError("Failed to fetch detections", "detection");

    res.status(500).json({
      message: "Failed to fetch detections",
    });

  }
};


/**
 * Delete detection
 */
exports.deleteDetection = async (req, res) => {

  try {

    const { id } = req.params;

    const deleted = await Detection.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Detection not found",
      });
    }

    res.json({
      message: "Detection deleted successfully",
    });

  } catch (err) {

    console.error("Delete detection error:", err);

    await logError("Failed to delete detection", "detection");

    res.status(500).json({
      message: "Server error",
    });

  }

};
