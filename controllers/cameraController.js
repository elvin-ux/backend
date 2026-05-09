const Camera = require("../models/Camera");


/**
 * Get all cameras for a specific device
 * GET /api/cameras/:deviceId
 */
exports.getCameras = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    const cameras = await Camera.find({ deviceId }).sort({ createdAt: -1 });

    const formatted = cameras.map((c) => ({
      id: c._id,
      cameraId: c.cameraId,
      name: c.name,
      status: c.status,
      streamUrl: c.streamUrl,
      location: c.location,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch cameras error:", err);
    res.status(500).json({ message: "Failed to fetch cameras" });
  }
};


/**
 * Update camera status
 * PUT /api/cameras/:id/status
 */
exports.updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["connected", "disconnected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const camera = await Camera.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }

    // Emit socket event for camera status change
    const io = req.app.get("io");
    if (io) {
      io.emit("camera_status_change", {
        cameraId: camera.cameraId,
        deviceId: camera.deviceId,
        status: camera.status,
        name: camera.name,
      });
    }

    res.json({
      message: "Camera status updated",
      camera: {
        id: camera._id,
        cameraId: camera.cameraId,
        name: camera.name,
        status: camera.status,
      },
    });
  } catch (err) {
    console.error("Update camera status error:", err);
    res.status(500).json({ message: "Failed to update camera status" });
  }
};


/**
 * Update camera stream URL
 * PUT /api/cameras/:deviceId/:cameraId/stream
 */
exports.updateCameraStreamUrl = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();
    const cameraId = req.params.cameraId.toUpperCase();
    const { streamUrl } = req.body;

    if (!streamUrl || typeof streamUrl !== "string") {
      return res.status(400).json({ message: "streamUrl is required" });
    }

    const trimmedStreamUrl = streamUrl.trim();

    if (!trimmedStreamUrl.endsWith("/whep")) {
      return res.status(400).json({
        message: "streamUrl must be the WHEP URL ending with /device001/whep",
      });
    }

    const camera = await Camera.findOneAndUpdate(
      { deviceId, cameraId },
      { streamUrl: trimmedStreamUrl, status: "connected" },
      { new: true }
    );

    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("camera_status_change", {
        cameraId: camera.cameraId,
        deviceId: camera.deviceId,
        status: camera.status,
        name: camera.name,
        streamUrl: camera.streamUrl,
      });
    }

    res.json({
      message: "Camera stream URL updated",
      camera: {
        id: camera._id,
        cameraId: camera.cameraId,
        deviceId: camera.deviceId,
        name: camera.name,
        status: camera.status,
        streamUrl: camera.streamUrl,
      },
    });
  } catch (err) {
    console.error("Update camera stream URL error:", err);
    res.status(500).json({ message: "Failed to update camera stream URL" });
  }
};
