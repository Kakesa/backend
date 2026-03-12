const fs = require('fs');
const path = require('path');

// Créer un avatar par défaut SVG
const createDefaultAvatar = () => {
  const svgContent = `
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="#E5E7EB"/>
  <circle cx="100" cy="80" r="30" fill="#9CA3AF"/>
  <path d="M100 120 C70 120, 50 140, 50 170 C50 190, 70 195, 100 195 C130 195, 150 190, 150 170 C150 140, 130 120, 100 120Z" fill="#9CA3AF"/>
</svg>
  `;

  const uploadsDir = path.join(__dirname, '../uploads');
  const avatarPath = path.join(uploadsDir, 'default-avatar.svg');

  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Écrire le fichier SVG
  fs.writeFileSync(avatarPath, svgContent.trim());
  console.log('Avatar par défaut créé:', avatarPath);
};

// Exporter la fonction
module.exports = { createDefaultAvatar };
