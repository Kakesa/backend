const nodemailer = require('nodemailer');

// ⚡ Configure ton transporter SMTP (ex: Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       // ex: smtp.gmail.com
  port: process.env.EMAIL_PORT,       // ex: 587
  secure: false,                      // true si port 465
  auth: {
    user: process.env.EMAIL_USER,     // ton email
    pass: process.env.EMAIL_PASS,     // ton mot de passe ou app password
  },
});

/**
 * Envoyer email d’activation
 */
const sendActivationEmail = async (to, code, name) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Code de vérification',
    html: `
      <p>Bonjour ${name},</p>
      <p>Voici votre code d’activation :</p>
      <h2>${code}</h2>
      <p>Ce code expire dans 10 minutes.</p>
    `,
  });
};

/**
 * Envoyer email de rappel de frais
 */
const sendFeeReminderEmail = async (to, studentName, feeName, balance) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Rappel de paiement : ${feeName}`,
    html: `
      <p>Bonjour,</p>
      <p>Ceci est un rappel concernant les frais scolaires de <strong>${studentName}</strong> pour <strong>${feeName}</strong>.</p>
      <p>Il reste un solde impayé de : <strong>${balance} USD</strong>.</p>
      <p>Veuillez régulariser la situation dès que possible. Si vous avez déjà effectué le paiement, merci d'ignorer cet e-mail.</p>
      <p>Cordialement,</p>
      <p>L'administration</p>
    `,
  });
};

module.exports = { sendActivationEmail, sendFeeReminderEmail };
