const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const schoolController = require('./school.controller');
const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware'); // import direct
const schoolSetup = require('../../middlewares/schoolSetup.middleware'); // import direct
const multer = require('multer');

/* =====================================================
   MULTER CONFIG
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Définit le chemin uploads à la racine backend
    const uploadPath = path.join(__dirname, '../uploads');
    // Crée le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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
   PROTECTED ROUTES
===================================================== */
router.use(protect);

/* =====================================================
   ROUTES
===================================================== */

// POST /api/schools - superadmin et admin
router.post(
  '/',
  restrictTo('superadmin', 'admin'),
  schoolSetup,
  upload.single('logo'),
  schoolController.createSchool
);


// GET /api/schools
router.get(
  '/',
  restrictTo('superadmin', 'admin'),
  schoolController.getAllSchools
);

// GET /api/schools/:id
router.get(
  '/:id',
  restrictTo('superadmin', 'admin'),
  schoolController.getSchoolById
);

// PUT /api/schools/:id
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
