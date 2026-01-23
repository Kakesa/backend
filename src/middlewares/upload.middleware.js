const multer = require('multer');
const path = require('path');

// Stockage en mémoire (on peut aussi mettre sur le disque)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
    return cb(new Error('Format de fichier non autorisé'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // max 5 Mo
});

module.exports = { upload };
