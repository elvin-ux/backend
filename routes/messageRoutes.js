const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require("../controllers/messageController");
// Depending on auth strategy, we might need a generic auth middleware or simply unprotected for this demo.
// Will leave unprotected like deviceRoutes if appropriate, or protect with officer auth.

router.get("/:deviceId", getMessages);
router.post("/send", sendMessage);
router.put("/:deviceId/read", markAsRead);

module.exports = router;
