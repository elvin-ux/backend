const SystemLog = require("../models/SystemLog");

exports.logInfo = async (message, source = "system") => {
  await SystemLog.create({
    type: "INFO",
    message,
    source,
  });
};

exports.logWarning = async (message, source = "system") => {
  await SystemLog.create({
    type: "WARNING",
    message,
    source,
  });
};

exports.logError = async (message, source = "system") => {
  await SystemLog.create({
    type: "ERROR",
    message,
    source,
  });
};
