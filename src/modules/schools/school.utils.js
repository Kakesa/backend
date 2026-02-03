const Counter = require('./school.counter.model');

const generateSchoolCode = async () => {
  // Générer les deux premiers chiffres aléatoires
  const randomPrefix = Math.floor(100 + Math.random() * 900); // Génère un nombre entre 100 et 999

  // Récupérer et incrémenter le compteur
  const counter = await Counter.findOneAndUpdate(
    { name: 'school' },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  // Formater le numéro de compteur en une chaîne de 2 chiffres
  const number = String(counter.seq).padStart(2, '0'); // S'assure que le compteur a au moins 2 chiffres

  // Retourner le code d'école avec le préfixe aléatoire et le compteur
  return `EG-${randomPrefix}-${number}`;
};

module.exports = {
  generateSchoolCode,
};