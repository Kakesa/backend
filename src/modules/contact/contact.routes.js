const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'contact@acadex.fr',
    pass: process.env.EMAIL_PASS || 'votre_mot_de_passe'
  }
});

// Route POST pour le formulaire de contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, newsletter } = req.body;

    // Validation des données
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse email invalide' 
      });
    }

    // Préparation de l'email pour l'administrateur
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'contact@acadex.fr',
      to: process.env.ADMIN_EMAIL || 'admin@acadex.fr',
      subject: `Nouveau message de contact - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ACADEX</h1>
            <p style="color: white; margin: 5px 0 0 0;">Nouveau message de contact</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Détails du message</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #4b5563;">Nom complet:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${name}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #4b5563;">Email:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${email}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #4b5563;">Sujet:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${subject}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #4b5563;">Newsletter:</strong>
              <span style="color: #1f2937; margin-left: 10px;">${newsletter ? 'Oui' : 'Non'}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #4b5563;">Message:</strong>
              <div style="color: #1f2937; margin-top: 10px; padding: 15px; background-color: white; border-left: 4px solid #2563eb;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
              <p style="color: #1e40af; margin: 0;">
                <strong>Note:</strong> Cet email a été envoyé automatiquement depuis le formulaire de contact du site ACADEX.
              </p>
            </div>
          </div>
          
          <div style="background-color: #1f2937; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              © 2024 ACADEX. Tous droits réservés.
            </p>
          </div>
        </div>
      `
    };

    // Préparation de l'email de confirmation pour l'utilisateur
    const userMailOptions = {
      from: process.env.EMAIL_USER || 'contact@acadex.fr',
      to: email,
      subject: 'Confirmation de votre message - ACADEX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ACADEX</h1>
            <p style="color: white; margin: 5px 0 0 0;">Confirmation de votre message</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Bonjour ${name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Nous avons bien reçu votre message concernant "${subject}". 
              Notre équipe vous répondra dans les plus brefs délais.
            </p>
            
            <div style="margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #2563eb;">
              <h3 style="color: #1f2937; margin-top: 0;">Votre message:</h3>
              <p style="color: #4b5563; margin: 10px 0;">
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #1f2937;">Nos coordonnées:</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li><strong>Email:</strong> contact@acadex.fr</li>
                <li><strong>Téléphone:</strong> +33 1 23 45 67 89</li>
                <li><strong>Adresse:</strong> 123 Avenue de l'Éducation, 75001 Paris</li>
              </ul>
            </div>
            
            ${newsletter ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #ecfdf5; border-radius: 8px;">
                <p style="color: #065f46; margin: 0;">
                  <strong>Newsletter:</strong> Vous êtes bien inscrit à notre newsletter et recevrez nos actualités.
                </p>
              </div>
            ` : ''}
          </div>
          
          <div style="background-color: #1f2937; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              © 2024 ACADEX. Tous droits réservés.
            </p>
          </div>
        </div>
      `
    };

    // Envoi des emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Message envoyé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du message' 
    });
  }
});

// Route GET pour vérifier le statut
router.get('/contact/status', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Contact ACADEX opérationnelle' 
  });
});

module.exports = router;
