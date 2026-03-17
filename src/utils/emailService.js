const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"ACADEX" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
