const mongoose = require('mongoose');

const archivedDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bulletin', 'report', 'certificate', 'transcript', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  className: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
archivedDocumentSchema.index({ studentId: 1, type: 1 });
archivedDocumentSchema.index({ className: 1, academicYear: 1 });
archivedDocumentSchema.index({ type: 1, academicYear: 1 });
archivedDocumentSchema.index({ uploadedBy: 1 });
archivedDocumentSchema.index({ title: 'text', description: 'text' });

// Virtual pour le formatage de la taille du fichier
archivedDocumentSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual pour le type formaté
archivedDocumentSchema.virtual('typeLabel').get(function() {
  const labels = {
    bulletin: 'Bulletin',
    report: 'Rapport',
    certificate: 'Certificat',
    transcript: 'Relevé',
    other: 'Autre'
  };
  return labels[this.type] || 'Autre';
});

// Méthode pour incrémenter le compteur de téléchargement
archivedDocumentSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

// Méthode statique pour obtenir les documents par type
archivedDocumentSchema.statics.getByType = function(type, options = {}) {
  const query = { type };
  return this.find(query)
    .populate('studentId')
    .populate('uploadedBy', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};

// Méthode statique pour obtenir les documents par étudiant
archivedDocumentSchema.statics.getByStudent = function(studentId, options = {}) {
  const query = { studentId };
  if (options.academicYear) {
    query.academicYear = options.academicYear;
  }
  if (options.type) {
    query.type = options.type;
  }
  return this.find(query)
    .populate('studentId')
    .sort(options.sort || { createdAt: -1 });
};

// Méthode statique pour les statistiques
archivedDocumentSchema.statics.getStats = function(filters = {}) {
  const matchStage = { $match: filters };
  const groupStage = {
    $group: {
      _id: '$type',
      count: { $sum: 1 },
      totalSize: { $sum: '$fileSize' }
    }
  };
  
  return this.aggregate([matchStage, groupStage]);
};

module.exports = mongoose.model('ArchivedDocument', archivedDocumentSchema);
