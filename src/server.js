require("dotenv").config();
const app = require("./app"); // ton Express déjà créé et configuré
const connectDB = require("./config/database");
const initSuperAdmin = require("./config/initSuperAdmin");

const PORT = process.env.PORT || 5000;

// 🔹 Si tu veux gérer les payloads volumineux, fais-le dans app.js
// Par exemple, dans app.js : app.use(express.json({ limit: '10mb' }));
// 🚀 Lancer les cron jobs
require('./jobs/subscriptionExpiration.job.js'); // attention au .js

connectDB().then(async () => {
  await initSuperAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
});
