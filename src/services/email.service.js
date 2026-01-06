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
 * @param {string} to email destinataire
 * @param {string} token token d’activation
 *  @param {string} name nom de l’utilisateur pour saluer
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


module.exports = { sendActivationEmail };
