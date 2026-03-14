require("dotenv").config();
const app = require("./app"); // ton Express déjà créé et configuré
const connectDB = require("./config/database");
const initSuperAdmin = require("./config/initSuperAdmin");
const cron = require('node-cron');
const { runFeeReminderJob } = require('./jobs/feeReminderJob');
const { createDefaultAvatar } = require('./modules/uploads/default-avatar');

const PORT = process.env.PORT || 5000;

// 🔹 Si tu veux gérer les payloads volumineux, fais-le dans app.js
// Par exemple, dans app.js : app.use(express.json({ limit: '10mb' }));

// 🚀 Lancer les cron jobs
require('./jobs/subscriptionExpiration.job.js'); // attention au .js

// 📅 Job planifié pour les rappels de frais - tous les jours à 9h00
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔄 Starting automatic fee reminder job...');
    await runFeeReminderJob();
  } catch (error) {
    console.error('❌ Error in scheduled fee reminder job:', error);
  }
});

console.log('📅 Fee reminder job scheduled to run daily at 9:00 AM');

connectDB().then(async () => {
  await initSuperAdmin();
  
  // Créer l'avatar par défaut s'il n'existe pas
  try {
    createDefaultAvatar();
  } catch (error) {
    console.error('Erreur lors de la création de l\'avatar par défaut:', error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
});
