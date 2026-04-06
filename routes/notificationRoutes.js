const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// Get all notifications for a device
router.get("/:deviceId", getNotifications);

// Get unread count
router.get("/:deviceId/count", getUnreadCount);

// Mark single notification as read
router.put("/:id/read", markAsRead);

// Mark all as read for a device
router.put("/:deviceId/read-all", markAllAsRead);

module.exports = router;
