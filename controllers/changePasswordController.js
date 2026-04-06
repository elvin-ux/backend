exports.changePassword = async (req, res) => {
  try {
    const { id, oldPassword, newPassword } = req.body;

    if (!id || !oldPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const device = await Device.findOne({ deviceId: id });

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    // Check old password
    const isMatch =
      oldPassword === device.activationCode ||
      await bcrypt.compare(oldPassword, device.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    device.password = await bcrypt.hash(newPassword, salt);

    await device.save();

    res.status(200).json({
      message: "Password changed successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
