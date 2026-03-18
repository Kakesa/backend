const ArchivedDocument = require('../../models/ArchivedDocument');
const Student = require('../students/student.model');
const Class = require('../classes/class.model');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads/archives');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Types de fichiers autorisés
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Obtenir les documents archivés selon le rôle de l'utilisateur
const getArchivedDocuments = async (req, res) => {
  try {
    const { user } = req;
    const { 
      search = '', 
      class: className = '', 
      year = academicYear = '', 
      type = documentType = '',
      page = 1,
      limit = 20 
    } = req.query;

    let query = {};
    let populateFields = 'studentId';

    // Construction de la requête selon le rôle
    switch (user.role) {
      case 'admin':
        // Admin peut voir tous les documents
        if (className) query['studentId.className'] = new RegExp(className, 'i');
        if (academicYear) query['studentId.academicYear'] = academicYear;
        if (documentType && documentType !== 'all') query.type = documentType;
        populateFields = 'studentId';
        break;

      case 'teacher':
        // Teacher voit les documents de ses classes
        const teacherClasses = await Class.find({ teacherId: user._id });
        if (teacherClasses) {
          query['studentId.className'] = { $in: teacherClasses.classes };
        }
        if (className) query['studentId.className'] = new RegExp(className, 'i');
        if (academicYear) query['studentId.academicYear'] = academicYear;
        if (documentType && documentType !== 'all') query.type = documentType;
        populateFields = 'studentId';
        break;

      case 'student':
        // Student voit seulement ses documents
        query.studentId = user._id;
        if (documentType && documentType !== 'all') query.type = documentType;
        if (academicYear) query.academicYear = academicYear;
        break;

      case 'parent':
        // Parent voit les documents de ses enfants
        const students = await Student.find({ parentId: user._id });
        const studentIds = students.map(s => s._id);
        query.studentId = { $in: studentIds };
        if (documentType && documentType !== 'all') query.type = documentType;
        if (academicYear) query.academicYear = academicYear;
        break;
    }

    // Recherche textuelle
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { 'studentId.firstName': new RegExp(search, 'i') },
        { 'studentId.lastName': new RegExp(search, 'i') },
        { 'studentId.className': new RegExp(search, 'i') }
      ];
    }

    const documents = await ArchivedDocument.find(query)
      .populate(populateFields)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ArchivedDocument.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération documents archivés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents archivés'
    });
  }
};

// Recherche avancée pour admin/teacher
const searchDocuments = async (req, res) => {
  try {
    const { 
      searchTerm, 
      className, 
      academicYear, 
      documentType,
      page = 1,
      limit = 20 
    } = req.query;

    let query = {};

    // Construction de la requête de recherche
    if (searchTerm) {
      query.$or = [
        { title: new RegExp(searchTerm, 'i') },
        { 'studentId.firstName': new RegExp(searchTerm, 'i') },
        { 'studentId.lastName': new RegExp(searchTerm, 'i') },
        { 'studentId.postNom': new RegExp(searchTerm, 'i') },
        { 'studentId.className': new RegExp(searchTerm, 'i') }
      ];
    }

    if (className) {
      query['studentId.className'] = new RegExp(className, 'i');
    }

    if (academicYear) {
      query['studentId.academicYear'] = academicYear;
    }

    if (documentType && documentType !== 'all') {
      query.type = documentType;
    }

    const documents = await ArchivedDocument.find(query)
      .populate('studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ArchivedDocument.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur recherche documents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des documents'
    });
  }
};

// Obtenir les archives d'un étudiant spécifique
const getStudentArchives = async (req, res) => {
  try {
    const { studentId } = req.params;
    const documents = await ArchivedDocument.find({ studentId })
      .populate('studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Erreur archives étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des archives de l\'étudiant'
    });
  }
};

// Télécharger un document
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { user } = req;

    const document = await ArchivedDocument.findById(documentId).populate('studentId');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérification des permissions
    const hasPermission = await checkDownloadPermission(user, document);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    const filePath = path.join(__dirname, '../../../uploads/archives', document.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    // Marquer le document comme téléchargé
    document.downloadCount = (document.downloadCount || 0) + 1;
    document.lastDownloadedAt = new Date();
    await document.save();

    res.download(filePath, document.originalName);
  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du document'
    });
  }
};

// Visualiser un document en ligne
const viewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { user } = req;

    const document = await ArchivedDocument.findById(documentId).populate('studentId');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérification des permissions
    const hasPermission = await checkViewPermission(user, document);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    const filePath = path.join(__dirname, '../../../uploads/archives', document.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    // Servir le fichier pour visualisation
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erreur visualisation document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la visualisation du document'
    });
  }
};

// Uploader un nouveau document
const uploadDocument = async (req, res) => {
  try {
    const { user } = req;
    
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'upload: ' + err.message
        });
      }

      const { title, type, studentId, academicYear, description } = req.body;
      const file = req.file;

      if (!title || !type || !studentId) {
        return res.status(400).json({
          success: false,
          message: 'Champs requis manquants'
        });
      }

      // Vérifier que l'étudiant existe et que l'utilisateur a les permissions
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Étudiant non trouvé'
        });
      }

      const hasUploadPermission = await checkUploadPermission(user, student);
      if (!hasUploadPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permission refusée pour cet étudiant'
        });
      }

      const newDocument = new ArchivedDocument({
        title,
        type,
        description,
        studentId,
        academicYear,
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: user._id,
        uploadedAt: new Date()
      });

      await newDocument.save();

      res.json({
        success: true,
        message: 'Document archivé avec succès',
        data: newDocument
      });
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage du document'
    });
  }
};

// Mettre à jour un document
const updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { user } = req;
    const updates = req.body;

    const document = await ArchivedDocument.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérification des permissions
    const hasUpdatePermission = await checkUpdatePermission(user, document);
    if (!hasUpdatePermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    Object.assign(document, updates);
    document.updatedAt = new Date();
    await document.save();

    res.json({
      success: true,
      message: 'Document mis à jour avec succès',
      data: document
    });
  } catch (error) {
    console.error('Erreur mise à jour document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du document'
    });
  }
};

// Supprimer un document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { user } = req;

    const document = await ArchivedDocument.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérification des permissions
    const hasDeletePermission = await checkDeletePermission(user, document);
    if (!hasDeletePermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '../../../uploads/archives', document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'entrée dans la base de données
    await ArchivedDocument.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du document'
    });
  }
};

// Obtenir les statistiques des archives
const getArchiveStats = async (req, res) => {
  try {
    const { user } = req;
    let matchQuery = {};

    // Selon le rôle, définir la requête
    switch (user.role) {
      case 'admin':
        // Admin voit toutes les statistiques
        break;
      case 'teacher':
        // Teacher voit les stats de ses classes
        const teacherClasses = await Class.find({ teacherId: user._id });
        if (teacherClasses) {
          matchQuery['studentId.className'] = { $in: teacherClasses.classes };
        }
        break;
      default:
        // Student/Parent voient leurs stats respectives
        matchQuery.studentId = user.role === 'student' ? user._id : 
          await Student.find({ parentId: user._id }).then(students => students.map(s => s._id));
        break;
    }

    const stats = await ArchivedDocument.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: '$count' },
          totalSize: { $sum: '$totalSize' },
          types: {
            $push: {
              type: '$_id',
              count: '$count',
              totalSize: '$totalSize'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalDocuments: 0,
        totalSize: 0,
        types: []
      }
    });
  } catch (error) {
    console.error('Erreur statistiques archives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Téléchargement en masse
const bulkDownload = async (req, res) => {
  try {
    const { documentIds } = req.body;
    const { user } = req;

    if (!documentIds || !Array.isArray(documentIds)) {
      return res.status(400).json({
        success: false,
        message: 'IDs de documents invalides'
      });
    }

    const documents = await ArchivedDocument.find({ 
      _id: { $in: documentIds } 
    }).populate('studentId');

    // Filtrer les documents autorisés
    const authorizedDocuments = [];
    for (const doc of documents) {
      const hasPermission = await checkDownloadPermission(user, doc);
      if (hasPermission) {
        authorizedDocuments.push(doc);
      }
    }

    // Créer un ZIP avec tous les documents
    const archiver = require('archiver');
    const zipPath = path.join(__dirname, '../../../temp/archives', `bulk-${Date.now()}.zip`);
    
    await archiver.zip([
      ...authorizedDocuments.map(doc => ({
        name: doc.originalName,
        path: path.join(__dirname, '../../../uploads/archives', doc.fileName)
      }))
    ]).finalize().pipe(fs.createWriteStream(zipPath));

    res.download(zipPath, `archives-bulk-${Date.now()}.zip`);
  } catch (error) {
    console.error('Erreur téléchargement masse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement en masse'
    });
  }
};

// Fonctions utilitaires de vérification des permissions
const checkDownloadPermission = async (user, document) => {
  switch (user.role) {
    case 'admin':
      return true;
    case 'teacher':
      // Vérifier si l'étudiant est dans la classe du professeur
      const teacherClasses = await Class.find({ teacherId: user._id });
      return teacherClasses && teacherClasses.classes.includes(document.studentId?.className);
    case 'student':
      return document.studentId?.toString() === user._id.toString();
    case 'parent':
      // Vérifier si l'étudiant est un enfant du parent
      const student = await Student.findById(document.studentId);
      return student && student.parentId?.toString() === user._id.toString();
    default:
      return false;
  }
};

const checkViewPermission = checkDownloadPermission;
const checkUpdatePermission = checkDownloadPermission;
const checkDeletePermission = checkDownloadPermission;
const checkUploadPermission = async (user, student) => {
  switch (user.role) {
    case 'admin':
      return true;
    case 'teacher':
      // Vérifier si l'étudiant est dans la classe du professeur
      const teacherClasses = await Class.find({ teacherId: user._id });
      return teacherClasses && teacherClasses.classes.includes(student.className);
    default:
      return false;
  }
};

module.exports = {
  getArchivedDocuments,
  searchDocuments,
  getStudentArchives,
  downloadDocument,
  viewDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getArchiveStats,
  bulkDownload
};
