const User = require("../modules/users/users.model");
const bcrypt = require("bcryptjs");

module.exports = async () => {
  try {
    const exists = await User.findOne({ role: "super-admin" });
    if (exists) {
      // console.log("✅ Superadmin déjà existant");
      return;
    }

    const password = await bcrypt.hash("SuperAdmin@123", 10);

    await User.create({
      name: "Super Admin",
      email: "superadmin@edugestion.com",
      password,
      role: "super-admin",
      isActive: true,
      needsSchoolSetup: false,
    });

    // console.log("🚀 Superadmin créé automatiquement");
  } catch (error) {
    console.error("Erreur lors de la création du superadmin:", error);
  }
};