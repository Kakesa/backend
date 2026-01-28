const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // 📌 Multer pour les fichiers
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// 🔹 Servir les fichiers statiques (logos, uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Connexion à la DB
connectDB();

// 🔹 CORS
app.use(
  cors({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 🔹 Parser JSON et urlencoded (pour les champs texte des formulaires)
app.use(express.json({ limit: '10mb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔹 Multer pour upload des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // dossier de destination
  },
  filename: (req, file, cb) => {
    // nom unique : timestamp + originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 Mo
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  }
});

// 🔹 Route pour test upload (tu peux intégrer dans ton controller school)
app.post('/api/test-upload', upload.single('logo'), (req, res) => {
  res.json({
    success: true,
    file: req.file,
    body: req.body,
  });
});

// 🔹 Routes principales
routes(app); // si tu veux utiliser multer dans tes routes

// 🔹 Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;
