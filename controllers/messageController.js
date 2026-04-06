const Message = require("../models/Message");
const Notification = require("../models/Notification");

// Get messages for a specific device (farm)
exports.getMessages = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const messages = await Message.find({ deviceId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { deviceId, senderId, senderRole, content } = req.body;

    const message = await Message.create({
      deviceId,
      senderId,
      senderRole,
      content
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("new_message", message);
      io.emit("new_notification", { deviceId, type: "chat" });
    }

    // Create a persisted chat notification for the farmer when officer sends a message
    if (senderRole === "officer") {
      try {
        await Notification.create({
          deviceId,
          type: "chat",
          title: "New Message from Officer",
          message: content.length > 80 ? content.substring(0, 80) + "..." : content,
        });
      } catch (notifErr) {
        console.error("Chat notification error:", notifErr);
      }
    }

    // SEND PUSH NOTIFICATION FOR CHAT
    try {
      const { sendPushNotification } = require("../utils/firebaseService");
      
      let title = "New message";
      let body = content.length > 50 ? content.substring(0, 50) + "..." : content;
      
      if (senderRole === "officer") {
        title = "New Message from Officer";
        const Device = require("../models/Device");
        const targetDevice = await Device.findOne({ deviceId });
        if (targetDevice && targetDevice.fcmToken) {
          await sendPushNotification(targetDevice.fcmToken, title, body, { type: 'chat', deviceId });
        }
      } else {
        title = `New Message from Farm ${deviceId}`;
        const ForestOfficer = require("../models/ForestOfficer");
        const officers = await ForestOfficer.find({ status: "Active" });
        for (const officer of officers) {
          if (officer.fcmToken) {
            await sendPushNotification(officer.fcmToken, title, body, { type: 'chat', deviceId });
          }
        }
      }
    } catch (pushErr) {
      console.error("Push notification error:", pushErr);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark messages as read for a device
exports.markAsRead = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { role } = req.body; // The role of the user marking messages as read

    // Mark messages sent by the opposite role as read
    const filterRole = role === 'officer' ? 'farmer' : 'officer';

    await Message.updateMany(
      { deviceId, senderRole: filterRole, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
