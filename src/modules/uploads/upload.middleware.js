const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le répertoire uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
const profileDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Configuration de Multer pour le stockage local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Middleware pour l'upload d'une seule photo de profil
const uploadProfilePhoto = upload.single('photo');

module.exports = {
  uploadProfilePhoto,
  upload,
  storage,
  fileFilter
};
