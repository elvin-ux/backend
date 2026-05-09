const Detection = require("../models/Detection");


// SUMMARY CARD DATA
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    const detections = await Detection.find({ deviceId });

    const totalDetections = detections.length;

    const animalCounts = {};
    const hourCounts = {};

    detections.forEach(d => {
      const animal = (d.animal || "unknown").toLowerCase();
      animalCounts[animal] = (animalCounts[animal] || 0) + 1;
      const hour = new Date(d.timestamp || d.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let mostFrequentAnimal = "None";
    let max = 0;
    for (const animal in animalCounts) {
      if (animalCounts[animal] > max) {
        max = animalCounts[animal];
        mostFrequentAnimal = animal;
      }
    }

    // Most dangerous: prefer elephant > tiger > leopard, then bear/boar/monkey
    const highRisk = ["elephant", "tiger", "leopard"];
    const mediumRisk = ["bear", "boar", "wild boar", "monkey"];
    let mostDangerousAnimal = "None";
    for (const tier of [highRisk, mediumRisk]) {
      let tierMax = 0;
      let tierAnimal = null;
      for (const a of tier) {
        if ((animalCounts[a] || 0) > tierMax) {
          tierMax = animalCounts[a];
          tierAnimal = a;
        }
      }
      if (tierAnimal) { mostDangerousAnimal = tierAnimal; break; }
    }
    if (mostDangerousAnimal === "None" && mostFrequentAnimal !== "None") {
      mostDangerousAnimal = mostFrequentAnimal;
    }

    // Peak time: find hour with most detections then format as range
    let peakHour = null;
    let peakCount = 0;
    for (const h in hourCounts) {
      if (hourCounts[h] > peakCount) {
        peakCount = hourCounts[h];
        peakHour = parseInt(h);
      }
    }
    let peakTime = "N/A";
    if (peakHour !== null) {
      const fmt = (h) => {
        const period = h < 12 ? "AM" : "PM";
        const hour = h % 12 === 0 ? 12 : h % 12;
        return `${hour}:00 ${period}`;
      };
      peakTime = `${fmt(peakHour)} - ${fmt((peakHour + 1) % 24)}`;
    }

    const highRiskCount = detections.filter(d =>
      highRisk.includes(d.animal.toLowerCase())
    ).length;

    res.json({
      deviceId,
      totalDetections,
      mostFrequentAnimal,
      highRiskCount,
      mostDangerousAnimal,
      peakTime,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// DETECTIONS PER DAY (LINE GRAPH)
exports.getDetectionHistory = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    const history = await Detection.aggregate([
      { $match: { deviceId } },

      {
        $addFields: {
          chartDate: { $ifNull: ["$timestamp", "$createdAt"] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$chartDate" }
          },
          count: { $sum: 1 }
        }
      },

      { $sort: { _id: 1 } }
    ]);

    res.json(history);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ANIMAL FREQUENCY (BAR CHART)
const IRRELEVANT_SPECIES = ["person", "cow", "cat", "monkey", "dog", "bird", "sheep", "horse"];

exports.getAnimalFrequency = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    const animals = await Detection.aggregate([
      { $match: { deviceId } },
      // Normalize animal name to lowercase to prevent duplicate species entries
      { $addFields: { animalNormalized: { $toLower: "$animal" } } },
      // Exclude non-wildlife species
      { $match: { animalNormalized: { $nin: IRRELEVANT_SPECIES } } },
      {
        $group: {
          _id: "$animalNormalized",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(animals);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// RISK DISTRIBUTION (PIE CHART)
exports.getRiskDistribution = async (req, res) => {
  try {
    const deviceId = req.params.deviceId.toUpperCase();

    const detections = await Detection.find({ deviceId });

    const riskCounts = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    const highRisk = ["elephant", "tiger", "leopard"];
    const mediumRisk = ["bear", "boar", "wild boar", "monkey"];

    detections.forEach(d => {
      const animal = d.animal.toLowerCase();
      if (highRisk.includes(animal)) riskCounts.HIGH++;
      else if (mediumRisk.includes(animal)) riskCounts.MEDIUM++;
      else riskCounts.LOW++;
    });

    const result = [
      { _id: "HIGH", count: riskCounts.HIGH },
      { _id: "MEDIUM", count: riskCounts.MEDIUM },
      { _id: "LOW", count: riskCounts.LOW }
    ];

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GLOBAL / OFFICER ANALYTICS ================= //

// GLOBAL SUMMARY CARD DATA
exports.getGlobalAnalyticsSummary = async (req, res) => {
  try {
    const detections = await Detection.find();
    const totalDetections = detections.length;
    const animalCounts = {};

    detections.forEach(d => {
      const animal = (d.animal || "unknown").toLowerCase();
      animalCounts[animal] = (animalCounts[animal] || 0) + 1;
    });

    let mostFrequentAnimal = "None";
    let max = 0;
    for (const animal in animalCounts) {
      if (animalCounts[animal] > max) {
        max = animalCounts[animal];
        mostFrequentAnimal = animal;
      }
    }

    res.json({
      totalDetections,
      mostFrequentAnimal,
      highRiskCount: detections.filter(d => ['elephant', 'leopard'].includes(d.animal.toLowerCase())).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DETECTIONS PER DAY (LINE GRAPH - Global)
exports.getGlobalDetectionHistory = async (req, res) => {
  try {
    const history = await Detection.aggregate([
      {
        $addFields: {
          chartDate: { $ifNull: ["$timestamp", "$createdAt"] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$chartDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ANIMAL FREQUENCY (BAR CHART - Global)
exports.getGlobalAnimalFrequency = async (req, res) => {
  try {
    const animals = await Detection.aggregate([
      // Normalize animal name to lowercase to prevent duplicate species counts
      { $addFields: { animalNormalized: { $toLower: "$animal" } } },
      // Exclude non-wildlife species
      { $match: { animalNormalized: { $nin: IRRELEVANT_SPECIES } } },
      {
        $group: {
          _id: "$animalNormalized",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RISK DISTRIBUTION (PIE CHART - Global)
exports.getGlobalRiskDistribution = async (req, res) => {
  try {
    const detections = await Detection.find();
    const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    detections.forEach(d => {
      let rLevel = d.riskLevel;
      if (!rLevel) {
          const animal = d.animal.toLowerCase();
          if (["elephant", "tiger", "leopard"].includes(animal)) rLevel = "high";
          else if (["bear", "boar", "wild boar", "monkey"].includes(animal)) rLevel = "medium";
          else rLevel = "low";
      }
      
      if (rLevel === "high") riskCounts.HIGH++;
      else if (rLevel === "medium") riskCounts.MEDIUM++;
      else riskCounts.LOW++;
    });

    const result = [
      { _id: "HIGH", count: riskCounts.HIGH },
      { _id: "MEDIUM", count: riskCounts.MEDIUM },
      { _id: "LOW", count: riskCounts.LOW }
    ];
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NOTE: getGlobalAlertsByTime (hourly heatmap) has been removed as it is no longer used in the UI.
