require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// HTTP + SOCKET.IO
const http = require("http");
const { Server } = require("socket.io");

const deviceRoutes = require("./routes/deviceRoutes");
const mobileAuthRoutes = require("./routes/mobileAuthRoutes");

const detectionRoutes = require("./routes/detectionRoutes"); // detection + delete + sort
const analyticsRoutes = require("./routes/analyticsRoutes"); // analytics endpoints
const dashboardRoutes = require("./routes/dashboardRoutes"); // dashboard stats
const cameraRoutes = require("./routes/cameraRoutes"); // camera management
const notificationRoutes = require("./routes/notificationRoutes"); // notifications

const app = express();


// ================= HTTP SERVER FOR WEBSOCKET =================
const server = http.createServer(app);


// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


// socket connection log
io.on("connection", (socket) => {
  console.log("Mobile app connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Mobile app disconnected:", socket.id);
  });
});


// make socket accessible inside controllers
app.set("io", io);


// ================= DATABASE =================
connectDB();


// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
// Serve generic uploads if needed, but /api/images is handled by imageRoutes with auth
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ADMIN ROUTES =================
app.use("/api/admin", require("./routes/adminAuthRoutes"));
app.use("/api/logs", require("./routes/logroutes"));


// ================= SYSTEM ROUTES =================
app.use("/api/devices", deviceRoutes);
app.use("/api/system-config", require("./routes/systemConfigRoutes"));
app.use("/api/officers", require("./routes/forestOfficerRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));


// ================= DETECTION ROUTES =================
// Includes:
// POST  /api/detections
// GET   /api/detections/:deviceId
// DELETE /api/detections/:id
// Sorting supported via query param
// Example:
// /api/detections/DEV-001?sort=confidence

app.use("/api/detections", detectionRoutes);

// ================= DETECTIONS ANALYTICS (GLOBAL) =================
// This is used by Admin Dashboard charts

const Detection = require("./models/Detection");
const Device = require("./models/Device");
const ForestOfficer = require("./models/ForestOfficer");

// ================= ADMIN GLOBAL DASHBOARD STATS =================
// Returns live counts for the admin dashboard stat cards
app.get("/api/admin/dashboard-stats", async (req, res) => {
  try {
    const [totalDetections, totalDevices, totalOfficers] = await Promise.all([
      Detection.countDocuments(),
      Device.countDocuments(),
      ForestOfficer.countDocuments()
    ]);

    // High risk detections (elephant, tiger, leopard)
    const highRiskAnimals = ["elephant", "tiger", "leopard"];
    const highRiskCount = await Detection.countDocuments({
      animal: { $in: highRiskAnimals.map(a => new RegExp(`^${a}$`, "i")) }
    });

    // Active devices (isActivated)
    const activeDevices = await Device.countDocuments({ isActivated: true });

    // Most recent detection
    const lastDetection = await Detection.findOne().sort({ timestamp: -1 }).limit(1);

    res.json({
      totalDetections,
      totalDevices,
      activeDevices,
      totalOfficers,
      highRiskCount,
      lastDetectedAnimal: lastDetection ? lastDetection.animal : "None",
      lastDetectedAt: lastDetection ? lastDetection.timestamp : null
    });
  } catch (err) {
    console.error("Admin Dashboard Stats Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Legacy analytics endpoint (kept for compatibility) — fixed to use d.animal
app.get("/api/detections-analytics", async (req, res) => {
  try {
    const detections = await Detection.find();

    const intrusionsByDate = {};
    detections.forEach(d => {
      const date = new Date(d.createdAt).toLocaleDateString();
      intrusionsByDate[date] = (intrusionsByDate[date] || 0) + 1;
    });

    const animalStats = {};
    detections.forEach(d => {
      const animal = d.animal || "Unknown";
      animalStats[animal] = (animalStats[animal] || 0) + 1;
    });

    const deviceStats = {};
    detections.forEach(d => {
      const device = d.deviceId || "Unknown";
      deviceStats[device] = (deviceStats[device] || 0) + 1;
    });

    res.json({
      intrusionsByDate: Object.keys(intrusionsByDate).map(date => ({
        date,
        count: intrusionsByDate[date]
      })),
      animalStats,
      deviceStats: Object.keys(deviceStats).map(device => ({
        device,
        count: deviceStats[device]
      }))
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= ANALYTICS ROUTES =================
// Device-specific analytics
// Example endpoints:
// /api/analytics/summary/DEV-001
// /api/analytics/history/DEV-001
// /api/analytics/animals/DEV-001
// /api/analytics/risks/DEV-001

app.use("/api/analytics", analyticsRoutes);


// ================= DASHBOARD ROUTES =================
app.use("/api/dashboard", dashboardRoutes);


// ================= CAMERA ROUTES =================
app.use("/api/cameras", cameraRoutes);


// ================= NOTIFICATION ROUTES =================
app.use("/api/notifications", notificationRoutes);


// ================= MOBILE LOGIN ROUTE =================
app.use("/api/mobile", mobileAuthRoutes);


// ================= IMAGE ROUTES =================
app.use("/api/images", require("./routes/imageRoutes"));


// ================= ROOT TEST ROUTE =================
app.get("/", (req, res) => {
  res.json({
    status: "EcoWatch backend running",
  });
});


// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});