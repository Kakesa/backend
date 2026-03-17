const express = require('express');
const router = express.Router();
const HelpRequest = require('../../models/HelpRequest');
const { protect } = require('../../middlewares/auth.middleware');
const { sendEmail } = require('../../utils/emailService');

// POST - Créer une nouvelle demande d'aide
router.post('/', protect, async (req, res) => {
  try {
    const { type, subject, description } = req.body;
    
    if (!type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
      });
    }

    // Créer la demande d'aide
    const helpRequest = new HelpRequest({
      id: Date.now().toString(),
      type,
      subject,
      description,
      userType: req.user.role,
      userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.name || 'Utilisateur',
      userEmail: req.user.email,
      userId: req.user._id || req.user.id,
      schoolId: req.user.schoolId || 'default-school'
    });

    await helpRequest.save();

    // Envoyer un email de confirmation à l'utilisateur
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Votre demande d\'aide ACADEX a été reçue',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎓 ACADEX</h1>
              <p style="margin: 10px 0; font-size: 16px;">Centre d'Aide</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Demande reçue ✅</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Bonjour ${req.user.firstName},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Votre demande d'aide a été reçue avec succès. Notre équipe va l'examiner et vous répondra dans les plus brefs délais.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #388bcf; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Détails de votre demande</h3>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Sujet:</strong> ${subject}</p>
                <p><strong>Description:</strong></p>
                <p style="background: white; padding: 15px; border-radius: 5px; color: #666;">${description}</p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                Vous pouvez suivre l'état de votre demande directement depuis votre espace ACADEX.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/dashboard/help" style="background: #388bcf; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Suivre ma demande
                </a>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px;">
              <p>Cet email a été envoyé automatiquement par ACADEX. Veuillez ne pas répondre à cet email.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Demande d\'aide créée avec succès',
      data: helpRequest
    });

  } catch (error) {
    console.error('Erreur création demande aide:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la demande'
    });
  }
});

// GET - Récupérer les demandes de l'utilisateur connecté
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await HelpRequest.find({ 
      userId: req.user._id || req.user.id,
      schoolId: req.user.schoolId || 'default-school'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Erreur récupération demandes utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des demandes'
    });
  }
});

// GET - Récupérer toutes les demandes (superadmin uniquement)
router.get('/', protect, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { 
      status, 
      type, 
      userType, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Construire le filtre
    const filter = { schoolId: req.user.schoolId || 'default-school' };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (userType) filter.userType = userType;
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await HelpRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'firstName lastName email role');

    const total = await HelpRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération demandes superadmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des demandes'
    });
  }
});

// PUT - Mettre à jour le statut d'une demande (superadmin uniquement)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { status, adminResponse } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Le statut est obligatoire'
      });
    }

    const helpRequest = await HelpRequest.findOneAndUpdate(
      { 
        id, 
        schoolId: req.user.schoolId || 'default-school'
      },
      { 
        status,
        ...(adminResponse && { adminResponse }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Si on ajoute une réponse, envoyer un email à l'utilisateur
    if (adminResponse) {
      try {
        await sendEmail({
          to: helpRequest.userEmail,
          subject: 'Réponse à votre demande d\'aide ACADEX',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🎓 ACADEX</h1>
                <p style="margin: 10px 0; font-size: 16px;">Centre d'Aide</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #333; margin-bottom: 20px;">Votre demande a été traitée ✅</h2>
                
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Bonjour ${helpRequest.userName},
                </p>
                
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  L'équipe ACADEX a traité votre demande concernant : <strong>${helpRequest.subject}</strong>
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #388bcf; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Réponse de l'équipe</h3>
                  <p style="background: white; padding: 15px; border-radius: 5px; color: #666; white-space: pre-wrap;">${adminResponse}</p>
                </div>
                
                <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                  Vous pouvez consulter l'intégralité de la conversation dans votre espace ACADEX.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL}/dashboard/help" style="background: #388bcf; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Voir ma demande
                  </a>
                </div>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px;">
                <p>Cet email a été envoyé automatiquement par ACADEX. Veuillez ne pas répondre à cet email.</p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Erreur envoi email réponse:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Demande mise à jour avec succès',
      data: helpRequest
    });

  } catch (error) {
    console.error('Erreur mise à jour demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
});

// GET - Statistiques des demandes (superadmin uniquement)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const schoolId = req.user.schoolId || 'default-school';
    
    const stats = await Promise.all([
      HelpRequest.countDocuments({ schoolId, status: 'pending' }),
      HelpRequest.countDocuments({ schoolId, status: 'in-progress' }),
      HelpRequest.countDocuments({ schoolId, status: 'resolved' }),
      HelpRequest.countDocuments({ schoolId }),
      HelpRequest.countDocuments({ schoolId, type: 'complaint' }),
      HelpRequest.countDocuments({ schoolId, type: 'feature' }),
      HelpRequest.countDocuments({ schoolId, type: 'bug' }),
      HelpRequest.countDocuments({ schoolId, type: 'question' })
    ]);

    res.json({
      success: true,
      data: {
        total: stats[3],
        pending: stats[0],
        inProgress: stats[1],
        resolved: stats[2],
        byType: {
          complaint: stats[4],
          feature: stats[5],
          bug: stats[6],
          question: stats[7]
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
