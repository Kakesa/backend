const ArchivedDocument = require('../models/ArchivedDocument');
const Student = require('../modules/students/student.model');
const Class = require('../modules/classes/class.model');

// Middleware pour vérifier les permissions d'accès aux archives
const checkArchivePermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const { documentId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // Si pas de documentId, passer au middleware suivant
      if (!documentId) {
        return next();
      }

      const document = await ArchivedDocument.findById(documentId).populate('studentId');
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document non trouvé'
        });
      }

      // Vérifier les permissions selon le rôle
      const hasPermission = await verifyUserPermission(user, document, requiredPermissions);
      
      if (!hasPermission.allowed) {
        return res.status(403).json({
          success: false,
          message: hasPermission.reason || 'Permission refusée'
        });
      }

      // Ajouter les informations du document à la requête
      req.document = document;
      next();
    } catch (error) {
      console.error('Erreur middleware archive:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

// Middleware pour valider les données d'upload d'archive
const validateArchiveUpload = async (req, res, next) => {
  try {
    const { user } = req;
    const { title, type, studentId, academicYear } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Validation des champs requis
    if (!title || !type || !studentId || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: title, type, studentId, academicYear'
      });
    }

    // Validation du type de document
    const allowedTypes = ['bulletin', 'report', 'certificate', 'transcript', 'other'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de document non valide'
      });
    }

    // Validation de l'année académique
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(academicYear)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'année académique invalide (attendu: YYYY-YYYY)'
      });
    }

    // Vérifier que l'étudiant existe
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    // Vérifier les permissions d'upload selon le rôle
    const uploadPermission = await verifyUploadPermission(user, student);
    if (!uploadPermission.allowed) {
      return res.status(403).json({
        success: false,
        message: uploadPermission.reason || 'Permission d\'upload refusée'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('Erreur validation upload archive:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation des données d\'upload'
    });
  }
};

// Middleware pour logger les accès aux archives
const logArchiveAccess = (req, res, next) => {
  try {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Logger l'accès si c'est une requête de document
      if (req.params.documentId && req.method === 'GET') {
        console.log(`Accès archive - Document: ${req.params.documentId}, User: ${req.user?._id}, Role: ${req.user?.role}, IP: ${req.ip}, Date: ${new Date().toISOString()}`);
      }
      
      originalSend.call(res, data);
    };
    
    next();
  } catch (error) {
    console.error('Erreur logging archive access:', error);
    next();
  }
};

// Middleware pour limiter le taux de téléchargement
const rateLimitDownload = (maxDownloads = 10, windowMs = 60000) => {
  const downloads = new Map();
  
  return (req, res, next) => {
    const { user } = req;
    const key = user?._id || req.ip;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    
    if (!downloads.has(key)) {
      downloads.set(key, { count: 0, resetTime: windowStart + windowMs });
    }
    
    const userDownloads = downloads.get(key);
    
    // Réinitialiser si la fenêtre est expirée
    if (now > userDownloads.resetTime) {
      downloads.set(key, { count: 0, resetTime: windowStart + windowMs });
    }
    
    if (downloads.get(key).count >= maxDownloads) {
      return res.status(429).json({
        success: false,
        message: `Trop de téléchargements. Maximum ${maxDownloads} par ${windowMs/1000} secondes`,
        retryAfter: userDownloads.resetTime
      });
    }
    
    downloads.get(key).count++;
    next();
  };
};

// Fonction utilitaire pour vérifier les permissions
const verifyUserPermission = async (user, document, requiredPermissions = []) => {
  try {
    switch (user.role) {
      case 'admin':
        return { allowed: true };
        
      case 'teacher':
        // Vérifier si l'étudiant est dans la classe du professeur
        const teacherClasses = await Class.find({ teacherId: user._id });
        const hasClassAccess = teacherClasses && 
          teacherClasses.classes.includes(document.studentId?.className);
        
        if (!hasClassAccess) {
          return { 
            allowed: false, 
            reason: 'Cet étudiant n\'est pas dans votre classe' 
          };
        }
        
        // Vérifier les permissions spécifiques requises
        if (requiredPermissions.length > 0) {
          // Logique de vérification des permissions spécifiques
          // À implémenter selon les besoins
        }
        
        return { allowed: true };
        
      case 'student':
        // L'étudiant ne peut accéder qu'à ses propres documents
        const isOwner = document.studentId?.toString() === user._id.toString();
        return { 
          allowed: isOwner, 
          reason: isOwner ? null : 'Accès non autorisé à ce document' 
        };
        
      case 'parent':
        // Le parent ne peut accéder qu'aux documents de ses enfants
        const student = await Student.findById(document.studentId);
        const isParent = student && student.parentId?.toString() === user._id.toString();
        return { 
          allowed: isParent, 
          reason: isParent ? null : 'Cet étudiant n\'est pas votre enfant' 
        };
        
      default:
        return { allowed: false, reason: 'Rôle non autorisé' };
    }
  } catch (error) {
    console.error('Erreur vérification permission:', error);
    return { allowed: false, reason: 'Erreur lors de la vérification' };
  }
};

// Fonction utilitaire pour vérifier les permissions d'upload
const verifyUploadPermission = async (user, student) => {
  try {
    switch (user.role) {
      case 'admin':
        return { allowed: true };
        
      case 'teacher':
        // Vérifier si l'étudiant est dans la classe du professeur
        const teacherClasses = await Class.find({ teacherId: user._id });
        const hasClassAccess = teacherClasses && 
          teacherClasses.classes.includes(student.className);
        
        return { 
          allowed: hasClassAccess, 
          reason: hasClassAccess ? null : 'Cet étudiant n\'est pas dans votre classe' 
        };
        
      default:
        return { allowed: false, reason: 'Permission d\'upload refusée pour ce rôle' };
    }
  } catch (error) {
    console.error('Erreur vérification permission upload:', error);
    return { allowed: false, reason: 'Erreur lors de la vérification' };
  }
};

module.exports = {
  checkArchivePermission,
  validateArchiveUpload,
  logArchiveAccess,
  rateLimitDownload
};
