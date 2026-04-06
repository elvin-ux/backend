const SystemConfig = require("../models/SystemConfig");

exports.getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();

    // Create default config if not exists
    if (!config) {
      config = await SystemConfig.create({
        activeModel: {
          name: "YOLOv8",
          version: "v1.0",
          uploadedAt: new Date(),
        },
        thresholds: [
          { animal: "Elephant", threshold: 0.85 },
          { animal: "Wild Boar", threshold: 0.75 },
          { animal: "Deer", threshold: 0.7 },
          { animal: "Monkey", threshold: 0.8 },
        ],
      });
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: "Failed to load system config" });
  }
};

exports.updateThreshold = async (req, res) => {
  const { animal, threshold } = req.body;

  try {
    const config = await SystemConfig.findOne();

    const item = config.thresholds.find(
      (t) => t.animal === animal
    );

    if (!item) {
      return res.status(404).json({ message: "Animal not found" });
    }

    item.threshold = threshold;
    await config.save();

    res.json({ message: "Threshold updated", config });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

exports.addThreshold = async (req, res) => {
  const { animal, threshold } = req.body;

  if (!animal || threshold === undefined) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const config = await SystemConfig.findOne();

    const exists = config.thresholds.find(
      (t) => t.animal.toLowerCase() === animal.toLowerCase()
    );

    if (exists) {
      return res.status(409).json({ message: "Animal already exists" });
    }

    config.thresholds.push({
      animal,
      threshold,
    });

    await config.save();

    res.status(201).json({
      message: "Animal threshold added",
      config,
    });
  } catch (err) {
    console.error("Add threshold error:", err);
    res.status(500).json({ message: "Failed to add animal" });
  }
};
