require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    name: "System Admin",
    email: "admin@system.com",
    password: hashedPassword
  });

  console.log("Admin created");
  process.exit();
}

createAdmin();
