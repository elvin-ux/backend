require("dotenv").config();
const mongoose = require("mongoose");
const Detection = require("./models/Detection");

async function clear() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Detection.deleteMany({});
  console.log(`✅ Removed ${result.deletedCount} detections.`);
  process.exit(0);
}

clear().catch(err => { console.error(err); process.exit(1); });
