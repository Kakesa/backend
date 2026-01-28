const express = require('express');
const router = express.Router();
const schoolService = require('./school.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { schoolSetup } = require('../../middlewares/schoolSetup.middleware');
const { schoolScope } = require('../../middlewares/schoolScope.middleware');
const multer = require('multer');
const path = require('path');

// Multer config (même que dans app.js)
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Seules les images sont autorisées'));
    cb(null, true);
  }
});
// 🔹 Toutes les routes protégées
router.use(protect);

// GET /schools
router.get("/", restrictTo("superadmin", "admin"), schoolScope, schoolService.getAllSchools);

// GET /schools/:id
router.get('/:id', restrictTo('admin'), schoolService.getSchoolById);

// POST /schools
router.post('/', restrictTo('admin'), schoolSetup, upload.single('logo'), schoolService.createSchool);

// PUT /schools/:id
router.put('/:id', restrictTo('admin'), schoolService.updateSchool);

// DELETE /schools/:id
router.delete('/:id', restrictTo('admin'), schoolService.deleteSchool);




module.exports = router;
