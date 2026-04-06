const Device = require("../models/Device");
const ForestOfficer = require("../models/ForestOfficer");
const bcrypt = require("bcryptjs");


// =========================================
// 🔐 LOGIN (Farmer / Officer)
// =========================================
exports.login = async (req, res) => {
  try {
    const { id, password, role, fcmToken } = req.body;

    console.log("LOGIN ATTEMPT:", id, role);

    if (!id || !password || !role) {
      return res.status(400).json({
        message: "ID, password and role are required",
      });
    }

    // =============================
    // 👨‍🌾 FARMER LOGIN
    // =============================
    if (role === "farmer") {

      const device = await Device.findOne({ deviceId: id });

      if (!device) {
        console.log("DEVICE NOT FOUND");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch =
        password === device.activationCode ||
        await bcrypt.compare(password, device.password);

      if (!isMatch) {
        console.log("PASSWORD NOT MATCH");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (fcmToken) {
        device.fcmToken = fcmToken;
        await device.save();
      }

      return res.status(200).json({
        message: "Login successful",
        role: "farmer",
        deviceId: device.deviceId,
        name: device.name,
        email: device.email,
        phone: device.phone,
        location: device.location,
      });
    }

    // =============================
    // 👮 OFFICER LOGIN
    // =============================
    if (role === "officer") {

      const officer = await ForestOfficer.findOne({ officerId: id });

      if (!officer) {
        console.log("OFFICER NOT FOUND");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, officer.password);

      if (!isMatch) {
        console.log("OFFICER PASSWORD NOT MATCH");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (fcmToken) {
        officer.fcmToken = fcmToken;
        await officer.save();
      }

      return res.status(200).json({
        message: "Login successful",
        role: "officer",
        officerId: officer.officerId,
      });
    }

    return res.status(400).json({ message: "Invalid role" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



// =========================================
// 👤 UPDATE PROFILE (Farmer)
// =========================================
exports.updateProfile = async (req, res) => {
  try {
    const { deviceId, name, email, phone, location } = req.body;

    console.log("UPDATE PROFILE:", deviceId);

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID required" });
    }

    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Update only if provided
    if (name !== undefined) device.name = name;
    if (email !== undefined) device.email = email;
    if (phone !== undefined) device.phone = phone;
    if (location !== undefined) device.location = location;

    await device.save();

    res.status(200).json({
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// =========================================
// 🔐 CHANGE PASSWORD (Farmer)
// =========================================
exports.changePassword = async (req, res) => {
  try {
    const { deviceId, oldPassword, newPassword } = req.body;

    console.log("CHANGE PASSWORD:", deviceId);

    if (!deviceId || !oldPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const device = await Device.findOne({ deviceId });

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    const isMatch =
      oldPassword === device.activationCode ||
      await bcrypt.compare(oldPassword, device.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect old password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    device.password = await bcrypt.hash(newPassword, salt);

    await device.save();

    res.status(200).json({
      message: "Password changed successfully",
    });

  } catch (error) {
    console.log("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// =========================================
// 📄 GET PROFILE (Farmer)
// =========================================
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findOne({ deviceId: id });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    res.status(200).json({
      deviceId: device.deviceId,
      name: device.name,
      email: device.email,
      phone: device.phone,
      location: device.location,
      status: device.status,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================================
// 🔔 UPDATE FCM TOKEN (Farmer or Officer)
// Called when Firebase refreshes the device token
// =========================================
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, deviceId, officerId } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "fcmToken is required" });
    }

    if (deviceId) {
      const device = await Device.findOne({ deviceId });
      if (!device) return res.status(404).json({ message: "Device not found" });
      device.fcmToken = fcmToken;
      await device.save();
      console.log(`FCM token updated for device: ${deviceId}`);
      return res.status(200).json({ message: "FCM token updated" });
    }

    if (officerId) {
      const officer = await ForestOfficer.findOne({ officerId });
      if (!officer) return res.status(404).json({ message: "Officer not found" });
      officer.fcmToken = fcmToken;
      await officer.save();
      console.log(`FCM token updated for officer: ${officerId}`);
      return res.status(200).json({ message: "FCM token updated" });
    }

    return res.status(400).json({ message: "deviceId or officerId required" });
  } catch (error) {
    console.log("UPDATE FCM TOKEN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

