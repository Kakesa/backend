const Teacher = require("./teacher.model");
const User = require("../users/users.model");

/* =====================================================
   CREATE TEACHER
===================================================== */
const createTeacher = async (data, createdByAdmin = false) => {
  // 🧹 Nettoyage des données
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects = data.subjects.filter(id => id && id.trim() !== "");
  }
  if (data.classes && Array.isArray(data.classes)) {
    data.classes = data.classes.filter(id => id && id.trim() !== "");
  }
  if (data.status) {
    data.status = data.status.toLowerCase();
  }

  // 🔐 Si créé par admin, créer un compte User avec mot de passe par défaut
  let userId = null;
  if (createdByAdmin && data.email) {
    try {
      const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() });
      
      if (!existingUser) {
        const newUser = await User.create({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email.toLowerCase().trim(),
          password: "123456", // Mot de passe par défaut
          role: "teacher",
          school: data.schoolId || data.school,
          isActive: true,
          mustChangePassword: true,
        });
        userId = newUser._id;
      } else {
        userId = existingUser._id;
      }
    } catch (err) {
      console.error("❌ Erreur lors de la création du User (Prof):", err.message);
    }
  }

  if (userId) {
    data.userId = userId;
  }

  const teacher = new Teacher(data);
  return await teacher.save();
};

/* =====================================================
   GET ALL TEACHERS
===================================================== */
const getAllTeachers = async (query = {}) => {
  const { schoolId, subjectId } = query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (subjectId) filter.subjects = subjectId;

  return await Teacher.find(filter)
    .populate("subjects", "name code")
    .populate("classes", "name level")
    .sort({ lastName: 1, firstName: 1 })
    .lean();
};

/* =====================================================
   GET TEACHER BY ID
===================================================== */
const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id)
    .populate("subjects", "name code")
    .populate("classes", "name level")
    .lean();
  if (!teacher) throw { statusCode: 404, message: "Professeur introuvable" };
  return teacher;
};

/* =====================================================
   GET TEACHER BY USER ID
===================================================== */
const getTeacherByUserId = async (userId) => {
  const teacher = await Teacher.findOne({ userId })
    .populate("subjects", "name code")
    .populate("classes", "name level")
    .lean();
  
  // Si le prof n'existe pas encore (compte User créé mais profil Teacher manquant)
  // On ne throw pas forcément d'erreur, on peut renvoyer null pour que le front gère
  return teacher;
};

/* =====================================================
   UPDATE TEACHER
===================================================== */
const updateTeacher = async (id, data) => {
  // 🧹 Nettoyage des données
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects = data.subjects.filter(id => id && id.trim() !== "");
  }
  if (data.classes && Array.isArray(data.classes)) {
    data.classes = data.classes.filter(id => id && id.trim() !== "");
  }
  if (data.status) {
    data.status = data.status.toLowerCase();
  }

  const teacher = await Teacher.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!teacher) throw { statusCode: 404, message: "Professeur introuvable" };
  return teacher;
};

/* =====================================================
   DELETE TEACHER
===================================================== */
const deleteTeacher = async (id) => {
  const result = await Teacher.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Professeur introuvable" };
  return true;
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getTeacherByUserId,
  updateTeacher,
  deleteTeacher,
};
