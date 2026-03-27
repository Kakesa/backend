const User = require("../modules/users/users.model");

module.exports = async () => {
  try {
    // Vérifier si le superadmin existe déjà
    const exists = await User.findOne({ role: "superadmin" });
    if (exists) {
      // console.log("✅ Superadmin déjà existant");
      return;
    }

    // ⚠️ IMPORTANT :
    // On met le mot de passe EN CLAIR
    // → le pre('save') du modèle va le hasher automatiquement
    await User.create({
      name: "Espoir Kakesa",
      email: "superadmin@edugestion.com",
      password: "SuperAdmin@123",
      role: "superadmin",
      isActive: true,
      needsSchoolSetup: false,
    });

    // console.log("🚀 Superadmin créé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la création du superadmin :", error);
  }
};
