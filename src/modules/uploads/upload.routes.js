const express = require('express');
const router = express.Router();
const { uploadProfilePhoto } = require('./upload.middleware');
const { getProfilePhoto, updateProfilePhoto, deleteProfilePhoto } = require('./upload.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Routes publiques pour obtenir les photos
router.get('/profile/:userType/:userId/photo', getProfilePhoto);

// Routes protégées pour modifier les photos
router.post('/profile/:userType/:userId/photo', 
  protect, 
  uploadProfilePhoto, 
  updateProfilePhoto
);

router.delete('/profile/:userType/:userId/photo', 
  protect, 
  deleteProfilePhoto
);

module.exports = router;
