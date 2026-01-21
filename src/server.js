require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const initSuperAdmin = require("./config/initSuperAdmin");

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await initSuperAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
});
