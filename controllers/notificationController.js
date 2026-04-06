const Notification = require("../models/Notification");


/**
 * Get notifications for a device
 * GET /api/notifications/:deviceId
 */
exports.getNotifications = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();
    const query = deviceId === 'ALL' 
        ? { read: false, type: { $nin: ["officer_note", "alert_status"] } } 
        : { deviceId };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = notifications.map((n) => ({
      id: n._id,
      deviceId: n.deviceId,
      type: n.type,
      title: n.title,
      message: n.message,
      detectionId: n.detectionId,
      read: n.read,
      createdAt: n.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};


/**
 * Get unread notification count
 * GET /api/notifications/:deviceId/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();
    const query = deviceId === 'ALL' 
        ? { read: false, type: { $nin: ["officer_note", "alert_status"] } } 
        : { deviceId, read: false };

    const count = await Notification.countDocuments(query);

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ message: "Failed to get unread count" });
  }
};


/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};


/**
 * Mark all notifications as read for a device
 * PUT /api/notifications/:deviceId/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();
    const query = deviceId === 'ALL' 
        ? { read: false, type: { $nin: ["officer_note", "alert_status"] } } 
        : { deviceId, read: false };

    await Notification.updateMany(query, { read: true });

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};
