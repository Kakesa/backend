const express = require('express');
const router = express.Router();
const schoolController = require('./school.controller');
const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware'); // export direct
const schoolSetup = require('../../middlewares/schoolSetup.middleware'); // ✅ correct
const multer = require('multer');
const path = require('path');

/* =====================================================
   MULTER CONFIGURATION
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  }
});

/* =====================================================
   ROUTES
===================================================== */
router.use(protect); // toutes les routes sont protégées

// console.log('restrictTo:', typeof restrictTo('superadmin', 'admin')); // doit être "function"
// console.log('schoolSetup:', typeof schoolSetup);                       // doit être "function"
// console.log('upload.single:', typeof upload.single('logo'));           // doit être "function"
// console.log('createSchool:', typeof schoolController.createSchool);    // doit être "function"

// POST /api/schools - accessible par superadmin et admin
router.post(
  '/',
  restrictTo('superadmin', 'admin'), // middleware rôle
  schoolSetup,                       // vérifie setup
  upload.single('logo'),              // upload logo
  schoolController.createSchool       // handler final
);

// GET /api/schools - superadmin et admin
router.get(
  '/',
  restrictTo('superadmin', 'admin'),
  schoolController.getAllSchools
);

// GET /api/schools/:id - superadmin et admin
router.get(
  '/:id',
  restrictTo('superadmin', 'admin'),
  schoolController.getSchoolById
);

// PUT /api/schools/:id - superadmin et admin
router.put(
  '/:id',
  restrictTo('superadmin', 'admin'),
  upload.single('logo'),
  schoolController.updateSchool
);

// DELETE /api/schools/:id - uniquement superadmin
router.delete(
  '/:id',
  restrictTo('superadmin'),
  schoolController.deleteSchool
);

module.exports = router;
