const fs = require('fs');
const path = require('path');
const User = require('../users/users.model');
const Student = require('../students/student.model');
const Teacher = require('../teachers/teacher.model');
const { Parent } = require('../parents/parent.model');

// Obtenir la photo de profil d'un utilisateur
const getProfilePhoto = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    let user;

    // Récupérer l'utilisateur selon le type
    switch (userType) {
      case 'user':
        user = await User.findById(userId);
        break;
      case 'student':
        user = await Student.findById(userId);
        break;
      case 'teacher':
        user = await Teacher.findById(userId);
        break;
      case 'parent':
        user = await Parent.findById(userId);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Type d\'utilisateur invalide' 
        });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    if (!user.photo) {
      // Retourner une image par défaut si aucune photo n'est définie
      const defaultImagePath = path.join(__dirname, '../uploads/default-avatar.png');
      if (fs.existsSync(defaultImagePath)) {
        return res.sendFile(defaultImagePath);
      } else {
        // Retourner une réponse vide si pas de photo par défaut
        return res.status(404).json({ 
          success: false, 
          message: 'Aucune photo de profil' 
        });
      }
    }

    // Construire le chemin complet de la photo
    const photoPath = path.join(__dirname, '../uploads/profiles', user.photo);
    
    if (fs.existsSync(photoPath)) {
      res.sendFile(photoPath);
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Fichier photo non trouvé' 
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// Mettre à jour la photo de profil
const updateProfilePhoto = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier fourni' 
      });
    }

    let user;

    // Récupérer l'utilisateur selon le type
    switch (userType) {
      case 'user':
        user = await User.findById(userId);
        break;
      case 'student':
        user = await Student.findById(userId);
        break;
      case 'teacher':
        user = await Teacher.findById(userId);
        break;
      case 'parent':
        user = await Parent.findById(userId);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Type d\'utilisateur invalide' 
        });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads/profiles', user.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Mettre à jour avec la nouvelle photo
    user.photo = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: {
        photo: req.file.filename,
        photoUrl: `/api/uploads/profile/${userType}/${userId}/photo`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// Supprimer la photo de profil
const deleteProfilePhoto = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    let user;

    // Récupérer l'utilisateur selon le type
    switch (userType) {
      case 'user':
        user = await User.findById(userId);
        break;
      case 'student':
        user = await Student.findById(userId);
        break;
      case 'teacher':
        user = await Teacher.findById(userId);
        break;
      case 'parent':
        user = await Parent.findById(userId);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Type d\'utilisateur invalide' 
        });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Supprimer le fichier photo
    if (user.photo) {
      const photoPath = path.join(__dirname, '../uploads/profiles', user.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Mettre à jour le champ photo à vide
    user.photo = "";
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

module.exports = {
  getProfilePhoto,
  updateProfilePhoto,
  deleteProfilePhoto
};
