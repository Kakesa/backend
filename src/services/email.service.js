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
const sendActivationEmail = async (to, token, name) => {
  const activationLink = `${process.env.FRONTEND_URL}/activate/${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Active ton compte',
    html: `
      <h2>Bienvenue ${name}!</h2>
      <p>Merci de t’être inscrit. Clique sur le lien ci-dessous pour activer ton compte :</p>
      <a href="${activationLink}">Activer mon compte</a>
      <p>Ce lien expire dans 24h.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendActivationEmail };
