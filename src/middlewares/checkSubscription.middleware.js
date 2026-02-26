const redis = require('../config/redis');
const School = require('../modules/schools/school.model');
const User = require('../modules/users/users.model');
const Student = require('../modules/students/student.model');
const Teacher = require('../modules/teachers/teacher.model');
const { Parent } = require('../modules/parents/parent.model');

module.exports = async (req, res, next) => {
  try {
    // 0️⃣ Superadmin bypass
    if (req.user?.role === 'superadmin') {
      return next();
    }

    let schoolId = req.user?.school?._id || req.user?.school;

    // SYNC RESCUE: Si le schoolId est manquant dans l'objet User, on tente de le récupérer depuis le profil lié
    if (!schoolId && req.user) {
      let foundSchoolId = null;
      const userId = req.user._id;

      if (req.user.role === 'student') {
        const student = await Student.findOne({ userId });
        if (student) foundSchoolId = student.school;
      } else if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ userId });
        if (teacher) foundSchoolId = teacher.schoolId;
      } else if (req.user.role === 'parent') {
        const parent = await Parent.findOne({ userId });
        if (parent) foundSchoolId = parent.schoolId;
      }

      if (foundSchoolId) {
        await User.findByIdAndUpdate(userId, { school: foundSchoolId });
        req.user.school = foundSchoolId;
        schoolId = foundSchoolId;
      }
    }

    if (!schoolId) {
      return res.status(403).json({ message: 'Aucune école associée' });
    }

    // 🔥 Clé Redis
    const redisKey = `school:${schoolId}:subscription`;

    // 1️⃣ Essayer de récupérer depuis Redis
    let subscription = await redis.get(redisKey);
    if (subscription) {
      subscription = JSON.parse(subscription);
    } else {
      // 2️⃣ Sinon récupérer depuis MongoDB
      const school = await School.findById(schoolId).lean();
      if (!school) {
        return res.status(404).json({ message: 'École introuvable' });
      }

      // Check school status first (Superadmin deactivation)
      if (school.status !== 'active') {
        return res.status(403).json({
          message: 'Cette école a été désactivée par le super-administrateur',
          reason: 'SCHOOL_DEACTIVATED'
        });
      }

      subscription = school.subscription;
      // 3️⃣ Stocker dans Redis 1h
      await redis.set(redisKey, JSON.stringify(subscription), 'EX', 3600);
    }

    // ❌ Vérification statut de l'abonnement
    const allowedStatuses = ['active', 'trial', 'free'];
    if (!subscription || !allowedStatuses.includes(subscription.status)) {
      return res.status(403).json({
        message: 'Abonnement expiré ou inactif. Veuillez contacter le support.',
        reason: 'SUBSCRIPTION_INACTIVE'
      });
    }

    // Vérifier la date de fin (Enforcement des 30 jours pour le trial)
    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      return res.status(403).json({
        message: 'Votre période d\'essai ou abonnement a expiré.',
        reason: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // 🟢 Tout est bon
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur vérification abonnement' });
  }
};
