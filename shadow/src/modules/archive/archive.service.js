const ArchivedDocument = require('../../models/ArchivedDocument');
const Student = require('../students/student.model');
const Class = require('../classes/class.model');
const fs = require('fs');
const path = require('path');

class ArchiveService {
  // Créer un bulletin de notes archivé
  static async createBulletin(studentData, bulletinData, uploadedBy) {
    try {
      const bulletin = new ArchivedDocument({
        title: `Bulletin de notes - ${bulletinData.trimestre}ème Trimestre`,
        type: 'bulletin',
        description: `Bulletin de notes de ${bulletinData.trimestre}ème trimestre pour l'année ${bulletinData.academicYear}`,
        studentId: studentData._id,
        className: studentData.className,
        academicYear: bulletinData.academicYear,
        fileName: this.generateFileName('bulletin', studentData, bulletinData),
        originalName: `Bulletin-${bulletinData.trimestre}T-${studentData.firstName}-${studentData.lastName}.pdf`,
        fileSize: bulletinData.fileSize || 0,
        mimeType: 'application/pdf',
        uploadedBy,
        metadata: {
          trimestre: bulletinData.trimestre,
          moyenne: bulletinData.moyenne,
          rang: bulletinData.rang,
          appreciation: bulletinData.appreciation,
          matieres: bulletinData.matieres
        }
      });

      return await bulletin.save();
    } catch (error) {
      throw new Error(`Erreur création bulletin: ${error.message}`);
    }
  }

  // Créer un rapport annuel
  static async createAnnualReport(studentData, reportData, uploadedBy) {
    try {
      const report = new ArchivedDocument({
        title: `Rapport Annuel - ${reportData.academicYear}`,
        type: 'report',
        description: `Rapport annuel complet pour l'année scolaire ${reportData.academicYear}`,
        studentId: studentData._id,
        className: studentData.className,
        academicYear: reportData.academicYear,
        fileName: this.generateFileName('report', studentData, reportData),
        originalName: `Rapport-Annuel-${reportData.academicYear}-${studentData.firstName}-${studentData.lastName}.pdf`,
        fileSize: reportData.fileSize || 0,
        mimeType: 'application/pdf',
        uploadedBy,
        metadata: {
          moyenneAnnuelle: reportData.moyenneAnnuelle,
          totalAbsences: reportData.totalAbsences,
          totalRetards: reportData.totalRetards,
          conducte: reportData.conducte,
          appreciationGenerale: reportData.appreciationGenerale,
          evolution: reportData.evolution
        }
      });

      return await report.save();
    } catch (error) {
      throw new Error(`Erreur création rapport annuel: ${error.message}`);
    }
  }

  // Créer un certificat
  static async createCertificate(studentData, certificateData, uploadedBy) {
    try {
      const certificate = new ArchivedDocument({
        title: `Certificat de ${certificateData.type}`,
        type: 'certificate',
        description: `Certificat de ${certificateData.type} délivré à ${studentData.firstName} ${studentData.lastName}`,
        studentId: studentData._id,
        className: studentData.className,
        academicYear: certificateData.academicYear,
        fileName: this.generateFileName('certificate', studentData, certificateData),
        originalName: `Certificat-${certificateData.type}-${studentData.firstName}-${studentData.lastName}.pdf`,
        fileSize: certificateData.fileSize || 0,
        mimeType: 'application/pdf',
        uploadedBy,
        metadata: {
          typeCertificat: certificateData.type,
          dateDelivrance: certificateData.dateDelivrance,
          lieuDelivrance: certificateData.lieuDelivrance,
          valideJusqua: certificateData.valideJusqua,
          autorite: certificateData.autorite
        }
      });

      return await certificate.save();
    } catch (error) {
      throw new Error(`Erreur création certificat: ${error.message}`);
    }
  }

  // Archiver automatiquement les bulletins en fin d'année
  static async archiveYearEndBulletins(academicYear) {
    try {
      const students = await Student.find({ academicYear, status: 'active' });
      const archivedBulletins = [];

      for (const student of students) {
        // Simuler la génération du bulletin (à remplacer avec la vraie logique)
        const bulletinData = await this.generateBulletinData(student, academicYear);
        const bulletin = await this.createBulletin(student, bulletinData, 'system');
        archivedBulletins.push(bulletin);
      }

      return archivedBulletins;
    } catch (error) {
      throw new Error(`Erreur archivage bulletins fin d'année: ${error.message}`);
    }
  }

  // Obtenir les statistiques d'archives par école
  static async getSchoolStats(schoolId, academicYear) {
    try {
      const students = await Student.find({ schoolId, academicYear });
      const studentIds = students.map(s => s._id);

      const stats = await ArchivedDocument.aggregate([
        {
          $match: {
            studentId: { $in: studentIds },
            academicYear
          }
        },
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

      return stats[0] || {
        totalDocuments: 0,
        totalSize: 0,
        types: []
      };
    } catch (error) {
      throw new Error(`Erreur statistiques école: ${error.message}`);
    }
  }

  // Obtenir les documents par classe
  static async getClassDocuments(className, academicYear, type = null) {
    try {
      const query = { 
        className,
        academicYear
      };
      
      if (type && type !== 'all') {
        query.type = type;
      }

      return await ArchivedDocument.find(query)
        .populate('studentId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Erreur documents par classe: ${error.message}`);
    }
  }

  // Rechercher des documents avec filtres avancés
  static async searchDocuments(filters, userRole) {
    try {
      let query = {};
      let populateFields = 'studentId';

      // Construction de la requête selon les filtres
      if (filters.searchTerm) {
        query.$or = [
          { title: new RegExp(filters.searchTerm, 'i') },
          { 'studentId.firstName': new RegExp(filters.searchTerm, 'i') },
          { 'studentId.lastName': new RegExp(filters.searchTerm, 'i') },
          { 'studentId.postNom': new RegExp(filters.searchTerm, 'i') },
          { 'studentId.className': new RegExp(filters.searchTerm, 'i') },
          { description: new RegExp(filters.searchTerm, 'i') }
        ];
      }

      if (filters.className) {
        query['studentId.className'] = new RegExp(filters.className, 'i');
      }

      if (filters.academicYear) {
        query.academicYear = filters.academicYear;
      }

      if (filters.type && filters.type !== 'all') {
        query.type = filters.type;
      }

      // Restrictions selon le rôle
      switch (userRole) {
        case 'teacher':
          // Limiter aux classes du professeur
          const teacherClasses = await Class.find({ teacherId: filters.teacherId });
          if (teacherClasses) {
            query['studentId.className'] = { $in: teacherClasses.classes };
          }
          break;
        case 'parent':
          // Limiter aux enfants du parent
          const students = await Student.find({ parentId: filters.parentId });
          query.studentId = { $in: students.map(s => s._id) };
          break;
        case 'student':
          // Limiter à l'étudiant lui-même
          query.studentId = filters.studentId;
          break;
      }

      const documents = await ArchivedDocument.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 20)
        .skip((filters.page - 1) * (filters.limit || 20));

      const total = await ArchivedDocument.countDocuments(query);

      return {
        documents,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total,
          pages: Math.ceil(total / (filters.limit || 20))
        }
      };
    } catch (error) {
      throw new Error(`Erreur recherche documents: ${error.message}`);
    }
  }

  // Nettoyer les anciennes archives (maintenance)
  static async cleanupOldArchives(yearsToKeep = 5) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsToKeep);

      const result = await ArchivedDocument.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} archives supprimées (plus de ${yearsToKeep} ans)`
      };
    } catch (error) {
      throw new Error(`Erreur nettoyage archives: ${error.message}`);
    }
  }

  // Générer un nom de fichier unique
  static generateFileName(type, student, data) {
    const timestamp = Date.now();
    const studentName = `${student.firstName}-${student.lastName}`.replace(/\s+/g, '-');
    
    switch (type) {
      case 'bulletin':
        return `bulletin-${data.trimestre}T-${studentName}-${timestamp}.pdf`;
      case 'report':
        return `rapport-annuel-${data.academicYear}-${studentName}-${timestamp}.pdf`;
      case 'certificate':
        return `certificat-${data.type}-${studentName}-${timestamp}.pdf`;
      default:
        return `document-${type}-${studentName}-${timestamp}.pdf`;
    }
  }

  // Générer les données d'un bulletin (simulation)
  static async generateBulletinData(student, academicYear) {
    // Simuler la récupération des données du bulletin
    // À remplacer avec la vraie logique de calcul des notes
    return {
      trimestre: 3,
      academicYear,
      moyenne: 14.5,
      rang: 8,
      appreciation: 'Bon travail',
      matieres: [
        { name: 'Mathématiques', note: 15, coefficient: 3 },
        { name: 'Français', note: 14, coefficient: 3 },
        { name: 'Histoire-Géographie', note: 13, coefficient: 2 }
      ]
    };
  }

  // Valider l'accès à un document
  static async validateDocumentAccess(documentId, userId, userRole) {
    try {
      const document = await ArchivedDocument.findById(documentId).populate('studentId');
      
      if (!document) {
        return { valid: false, reason: 'Document non trouvé' };
      }

      switch (userRole) {
        case 'admin':
          return { valid: true };
        case 'teacher':
          const teacherClasses = await Class.find({ teacherId: userId });
          const hasAccess = teacherClasses && 
            teacherClasses.classes.includes(document.studentId?.className);
          return { 
            valid: hasAccess, 
            reason: hasAccess ? null : 'Classe non assignée à ce professeur' 
          };
        case 'student':
          const isOwner = document.studentId?.toString() === userId.toString();
          return { 
            valid: isOwner, 
            reason: isOwner ? null : 'Accès non autorisé à ce document' 
          };
        case 'parent':
          const student = await Student.findById(document.studentId);
          const isParent = student && student.parentId?.toString() === userId.toString();
          return { 
            valid: isParent, 
            reason: isParent ? null : 'Cet étudiant n\'est pas votre enfant' 
          };
        default:
          return { valid: false, reason: 'Rôle non autorisé' };
      }
    } catch (error) {
      throw new Error(`Erreur validation accès: ${error.message}`);
    }
  }
}

module.exports = ArchiveService;
