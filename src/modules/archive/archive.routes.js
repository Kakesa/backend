const express = require('express');
const router = express.Router();
const archiveController = require('../archive/archive.controller');
const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

// Middleware d'authentification pour toutes les routes
router.use(protect);

// Routes pour les archives - accessibles selon le rôle
router.get('/', restrictTo(['admin', 'teacher', 'student', 'parent']), archiveController.getArchivedDocuments);
router.get('/search', restrictTo(['admin', 'teacher']), archiveController.searchDocuments);
router.get('/student/:studentId', restrictTo(['admin', 'teacher']), archiveController.getStudentArchives);
router.get('/download/:documentId', restrictTo(['admin', 'teacher', 'student', 'parent']), archiveController.downloadDocument);
router.get('/view/:documentId', restrictTo(['admin', 'teacher', 'student', 'parent']), archiveController.viewDocument);
router.post('/upload', restrictTo(['admin', 'teacher']), archiveController.uploadDocument);
router.put('/:documentId', restrictTo(['admin', 'teacher']), archiveController.updateDocument);
router.delete('/:documentId', restrictTo(['admin', 'teacher']), archiveController.deleteDocument);
router.get('/stats', restrictTo(['admin', 'teacher']), archiveController.getArchiveStats);
router.post('/bulk-download', restrictTo(['admin', 'teacher']), archiveController.bulkDownload);

module.exports = router;
