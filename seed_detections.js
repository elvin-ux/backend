/**
 * seed_detections.js
 * Run with: node seed_detections.js
 * Seeds the Detection collection with realistic test data for the dashboard.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Detection = require("./models/Detection");

const DEVICES = ["DEV-001", "DEV-002", "DEV-003"];

const ANIMALS = [
  { name: "elephant", risk: "high",   weight: 10 },
  { name: "leopard",  risk: "high",   weight: 6  },
  { name: "tiger",    risk: "high",   weight: 4  },
  { name: "bear",     risk: "medium", weight: 8  },
  { name: "boar",     risk: "medium", weight: 12 },
  { name: "deer",     risk: "low",    weight: 14 },
  { name: "dog",      risk: "low",    weight: 10 },
  { name: "cat",      risk: "low",    weight: 6  },
];

function weightedRandom(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomDate(daysAgo) {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Clear existing detections
    await Detection.deleteMany({});
    console.log("🗑  Cleared existing detections");

    const docs = [];

    // 90 detections spread over last 45 days across 3 devices
    for (let i = 0; i < 90; i++) {
      const animal = weightedRandom(ANIMALS);
      const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const timestamp = randomDate(45);

      docs.push({
        deviceId: device,
        animal: animal.name,
        confidence: parseFloat((0.55 + Math.random() * 0.44).toFixed(2)),
        sensorTriggered: Math.random() > 0.4,
        detectionSource: ["ml", "sensor", "combined"][Math.floor(Math.random() * 3)],
        riskLevel: animal.risk,
        status: ["Pending", "Investigating", "Resolved"][Math.floor(Math.random() * 3)],
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // Also add 10 recent detections (last 3 days) for fresh visible data
    const recentAnimals = ["elephant", "leopard", "bear", "boar", "deer"];
    for (let i = 0; i < 10; i++) {
      const animalName = recentAnimals[Math.floor(Math.random() * recentAnimals.length)];
      const animalObj = ANIMALS.find(a => a.name === animalName);
      const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const timestamp = randomDate(3);
      docs.push({
        deviceId: device,
        animal: animalName,
        confidence: parseFloat((0.70 + Math.random() * 0.29).toFixed(2)),
        sensorTriggered: true,
        detectionSource: "combined",
        riskLevel: animalObj.risk,
        status: "Pending",
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await Detection.insertMany(docs, { timestamps: false });
    console.log(`✅ Inserted ${docs.length} detections`);

    // Summary
    const counts = {};
    docs.forEach(d => { counts[d.animal] = (counts[d.animal] || 0) + 1; });
    console.log("\n📊 Animal breakdown:");
    Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
      console.log(`   ${k.padEnd(10)} × ${v}`);
    });

    const riskCounts = { high: 0, medium: 0, low: 0 };
    docs.forEach(d => riskCounts[d.riskLevel]++);
    console.log("\n⚠  Risk breakdown:");
    console.log(`   HIGH   × ${riskCounts.high}`);
    console.log(`   MEDIUM × ${riskCounts.medium}`);
    console.log(`   LOW    × ${riskCounts.low}`);

    console.log("\n🎉 Done! Refresh the dashboard to see charts.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
