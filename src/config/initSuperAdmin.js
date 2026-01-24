const User = require("../modules/users/users.model");
const bcrypt = require("bcryptjs");

module.exports = async () => {
  try {
    const exists = await User.findOne({ role: "superadmin" });
    if (exists) {
      // console.log("✅ Superadmin déjà existant");
      return;
    }

    const password = await bcrypt.hash("SuperAdmin@123", 10);

    await User.create({
      name: "Super Admin",
      email: "superadmin@edugestion.com",
      password,
      role: "superadmin",
      isActive: true,
      needsSchoolSetup: false,
    });

    // console.log("🚀 Superadmin créé automatiquement");
  } catch (error) {
    console.error("Erreur lors de la création du superadmin:", error);
  }
};