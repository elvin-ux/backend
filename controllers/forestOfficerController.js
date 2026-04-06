const ForestOfficer = require("../models/ForestOfficer");
const Detection = require("../models/Detection");
const Device = require("../models/Device");
const bcrypt = require("bcryptjs");
const { logInfo, logError } = require("../utils/systemLogger");

// Register officer
exports.registerOfficer = async (req, res) => {
  try {
    const { officerId, password } = req.body;

    if (!officerId || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await ForestOfficer.findOne({ officerId });
    if (exists) {
      return res.status(409).json({ message: "Officer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const officer = await ForestOfficer.create({
      officerId,
      password: hashedPassword,
    });

    await logInfo(`Forest officer registered: ${officerId}`, "admin");

    res.status(201).json({
      message: "Forest officer registered",
      officerId: officer.officerId,
    });
  } catch (err) {
    console.error(err);
    await logError("Forest officer registration failed", "admin");
    res.status(500).json({ message: "Server error" });
  }
};

// Get all officers
exports.getOfficers = async (req, res) => {
  try {
    const officers = await ForestOfficer.find().select("-password");
    res.json(officers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch officers" });
  }
};

// =========================================
// 📊 DASHBOARD STATS
// =========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalAlertsToday = await Detection.countDocuments({
      timestamp: { $gte: today },
    });

    const highRiskAlerts = await Detection.countDocuments({
      riskLevel: "high",
    });

    const activeFarms = await Device.countDocuments({
      status: "Assigned",
    });

    const resolvedAlerts = await Detection.countDocuments({
      status: "Resolved",
    });

    // New: per-status counts for dashboard cards
    const pendingAlerts = await Detection.countDocuments({
      status: "Pending",
    });

    const investigatingAlerts = await Detection.countDocuments({
      status: "Investigating",
    });

    res.status(200).json({
      totalAlertsToday,
      highRiskAlerts,
      activeFarms,
      resolvedAlerts,
      pendingAlerts,
      investigatingAlerts,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================
// 🚨 ALERTS MONITORING SYSTEM
// =========================================
exports.getAlerts = async (req, res) => {
  try {
    const { riskLevel, animal, date } = req.query;
    let query = {};

    if (riskLevel) query.riskLevel = riskLevel;
    if (animal) query.animal = animal;
    if (date) {
      const queryDate = new Date(date);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.timestamp = { $gte: queryDate, $lt: nextDate };
    }

    const alerts = await Detection.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Pagination could be added later

    res.status(200).json(alerts);
  } catch (err) {
    console.error("Fetch Alerts Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================
// 🛠 UPDATE ALERT STATUS
// =========================================
const STATUS_ORDER = ["Pending", "Investigating", "Resolved"];
const Notification = require("../models/Notification");

// Species considered irrelevant (not wildlife threats)
const IRRELEVANT_SPECIES = ["person", "cow", "cat", "monkey", "dog", "bird", "sheep", "horse"];

exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, officerNote } = req.body;

    const detection = await Detection.findById(id);

    if (!detection) {
      return res.status(404).json({ message: "Detection not found" });
    }

    // Enforce one-way status transitions: Pending → Investigating → Resolved
    if (status && status !== detection.status) {
      const currentIdx = STATUS_ORDER.indexOf(detection.status);
      const newIdx = STATUS_ORDER.indexOf(status);

      if (newIdx === -1) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      if (newIdx <= currentIdx) {
        return res.status(400).json({
          message: `Cannot revert status from '${detection.status}' to '${status}'. Status transitions are one-way only.`,
        });
      }

      detection.status = status;

      // Send push notification to farmer when status advances
      let notifTitle = "";
      let notifMessage = "";
      if (status === "Investigating") {
        notifTitle = "Officer Response";
        notifMessage = "A Forest Officer has started investigating your alert. Help is on the way!";
      } else if (status === "Resolved") {
        notifTitle = "Alert Resolved";
        notifMessage = "Your wildlife alert has been resolved by the Forest Officer. Stay safe!";
      }

      if (notifTitle) {
        await Notification.create({
          deviceId: detection.deviceId,
          type: "alert_status",
          title: notifTitle,
          message: notifMessage,
          detectionId: detection._id,
        });
      }
    }

    if (notes !== undefined) detection.notes = notes;

    // Handle officerNote — save and notify farmer
    if (officerNote !== undefined && officerNote !== detection.officerNote) {
      detection.officerNote = officerNote;
      if (officerNote.trim()) {
        await Notification.create({
          deviceId: detection.deviceId,
          type: "officer_note",
          title: "Officer Update",
          message: `Officer update: ${officerNote}`,
          detectionId: detection._id,
        });
      }
    }

    await detection.save();

    res.status(200).json({
      message: "Alert updated successfully",
      detection,
    });
  } catch (err) {
    console.error("Update Alert Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================
// 🧠 AI INSIGHTS
// =========================================
exports.getInsights = async (req, res) => {
  try {
    // 1. Most frequent RELEVANT wildlife species (excluding irrelevant ones)
    const animalAgg = await Detection.aggregate([
      { $addFields: { animalLower: { $toLower: "$animal" } } },
      { $match: { animalLower: { $nin: IRRELEVANT_SPECIES } } },
      { $group: { _id: "$animalLower", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const frequentAnimal = animalAgg.length > 0 ? animalAgg[0]._id : "Unknown";

    // 2. High risk farms — enriched with device name, sorted by alert count
    const zonesAgg = await Detection.aggregate([
      { $match: { riskLevel: "high" } },
      { $group: { _id: "$deviceId", alertCount: { $sum: 1 } } },
      { $sort: { alertCount: -1 } },
      { $limit: 5 }
    ]);

    // Enrich zones with farm names from Device collection
    const highRiskZones = [];
    for (const zone of zonesAgg) {
      const device = await Device.findOne({ deviceId: zone._id }).select("name deviceId");
      highRiskZones.push({
        deviceId: zone._id,
        name: device?.name || "Unknown Farm",
        alertCount: zone.alertCount,
      });
    }

    // 3. Peak intrusion time
    const timeAgg = await Detection.aggregate([
      { $project: { hour: { $hour: "$timestamp" } } },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const peakHour = timeAgg.length > 0 ? timeAgg[0]._id : 0;
    const peakTimeRange = `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`;

    // 4. Dynamic AI Recommendation
    let aiRecommendation = "Monitoring levels are stable. Continue standard protocol.";
    if (frequentAnimal !== "Unknown" && timeAgg.length > 0) {
      aiRecommendation = `Increased ${frequentAnimal.toUpperCase()} activity detected between ${peakTimeRange}. It is highly recommended to dispatch additional units to high-risk zones or employ non-lethal deterrents during these hours.`;
    }

    res.status(200).json({
      frequentAnimal,
      peakTimeRange,
      highRiskZones,
      aiRecommendation,
    });
  } catch (err) {
    console.error("Insights Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================
// 📊 FARM MANAGEMENT
// =========================================
exports.getFarms = async (req, res) => {
  try {
    // Return all registered devices (farms) and their latest alert time
    const devices = await Device.find({});
    
    // Can map through or aggregate to find last alert. For simplicity and performance, we do a basic look up.
    // In production, an aggregation pipeline linking Device and Detection is better.
    let farms = [];
    for (let device of devices) {
      const lastAlert = await Detection.findOne({ deviceId: device.deviceId })
        .sort({ timestamp: -1 })
        .select("timestamp animal");

      farms.push({
        deviceId: device.deviceId,
        name: device.name || "Unknown Farm",
        status: device.isActivated ? "Green" : "Red",
        lastAlertTime: lastAlert ? lastAlert.timestamp : null,
        lastAlertAnimal: lastAlert ? lastAlert.animal : "N/A",
      });
    }

    res.status(200).json(farms);
  } catch (err) {
    console.error("Farms Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
