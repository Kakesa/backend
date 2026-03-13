const Absence = require("./absence.model");
const Justification = require("./justification.model");
const Teacher = require("../teachers/teacher.model");
const Student = require("../students/student.model");
const Class = require("../classes/class.model");

/* =====================================================
   ABSENCE SERVICE
===================================================== */
const createAbsence = async (data) => {
  const absence = new Absence(data);
  return await absence.save();
};

const getAbsences = async (query = {}) => {
  const { studentId, status } = query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  return await Absence.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate("justificationId")
    .sort({ startDate: -1 })
    .lean();
};

const updateAbsence = async (id, data) => {
  return await Absence.findByIdAndUpdate(id, data, { new: true });
};

/* =====================================================
   TEACHER SPECIFIC SERVICES
===================================================== */
const getTeacherClassesAbsences = async (teacherId, query = {}) => {
  const teacher = await Teacher.findOne({ userId: teacherId }).populate('classes');
  if (!teacher) throw new Error('Professeur non trouvé');

  const classIds = teacher.classes.map(cls => cls._id);
  const { status, startDate, endDate } = query;
  
  const filter = { 
    studentId: { 
      $in: await Student.find({ class: { $in: classIds } }).distinct('_id') 
    } 
  };
  
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  return await Absence.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate({
      path: "studentId",
      populate: { path: "class", select: "name" }
    })
    .populate("justificationId")
    .sort({ startDate: -1 })
    .lean();
};

const getClassAbsences = async (classId, teacherId, query = {}) => {
  const teacher = await Teacher.findOne({ userId: teacherId });
  if (!teacher) throw new Error('Professeur non trouvé');

  const hasAccess = teacher.classes.includes(classId);
  if (!hasAccess && req.user.role !== 'admin') {
    throw new Error('Accès non autorisé à cette classe');
  }

  const { status, startDate, endDate } = query;
  const filter = { 
    studentId: { 
      $in: await Student.find({ class: classId }).distinct('_id') 
    } 
  };
  
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  return await Absence.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate("justificationId")
    .sort({ startDate: -1 })
    .lean();
};

const markAbsence = async (data) => {
  const { studentId, startDate, endDate, reason, teacherId } = data;
  
  const teacher = await Teacher.findOne({ userId: teacherId });
  if (!teacher) throw new Error('Professeur non trouvé');

  const student = await Student.findById(studentId).populate('class');
  if (!student) throw new Error('Étudiant non trouvé');

  const hasAccess = teacher.classes.includes(student.class._id);
  if (!hasAccess && req.user.role !== 'admin') {
    throw new Error('Accès non autorisé à cet étudiant');
  }

  const absence = new Absence({
    studentId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason,
    status: "unjustified"
  });

  return await absence.save();
};

const updateTeacherAbsence = async (id, data, teacherId) => {
  const teacher = await Teacher.findOne({ userId: teacherId });
  if (!teacher) throw new Error('Professeur non trouvé');

  const absence = await Absence.findById(id).populate({
    path: "studentId",
    populate: { path: "class" }
  });
  
  if (!absence) throw new Error('Absence non trouvée');

  const hasAccess = teacher.classes.includes(absence.studentId.class._id);
  if (!hasAccess && req.user.role !== 'admin') {
    throw new Error('Accès non autorisé à cette absence');
  }

  return await Absence.findByIdAndUpdate(id, data, { new: true });
};

const getPendingTeacherJustifications = async (teacherId) => {
  const teacher = await Teacher.findOne({ userId: teacherId }).populate('classes');
  if (!teacher) throw new Error('Professeur non trouvé');

  const classIds = teacher.classes.map(cls => cls._id);
  
  return await Justification.find({ 
    status: "pending",
    studentId: { 
      $in: await Student.find({ class: { $in: classIds } }).distinct('_id') 
    }
  })
  .populate("studentId", "firstName lastName matricule")
  .populate({
    path: "studentId",
    populate: { path: "class", select: "name" }
  })
  .sort({ createdAt: -1 })
  .lean();
};

const reviewTeacherJustification = async (id, data) => {
  const { status, reviewedBy, reviewNotes } = data;
  const justification = await Justification.findByIdAndUpdate(
    id, 
    { status, reviewedBy, reviewNotes }, 
    { new: true }
  );

  if (status === "approved") {
    await Absence.updateMany(
      { justificationId: id },
      { $set: { status: "justified" } }
    );
  } else if (status === "rejected") {
    await Absence.updateMany(
      { justificationId: id },
      { $set: { status: "unjustified" } }
    );
  }

  return justification;
};

/* =====================================================
   JUSTIFICATION SERVICE
===================================================== */
const createJustification = async (data) => {
  const justification = new Justification(data);
  return await justification.save();
};

const getJustifications = async (query = {}) => {
  const { studentId, status } = query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  return await Justification.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
};

const reviewJustification = async (id, data) => {
  const { status, reviewedBy, reviewNotes } = data;
  const justification = await Justification.findByIdAndUpdate(
    id, 
    { status, reviewedBy, reviewNotes }, 
    { new: true }
  );

  // If approved, update linked absences
  if (status === "approved") {
    await Absence.updateMany(
      { justificationId: id },
      { $set: { status: "justified" } }
    );
  } else if (status === "rejected") {
    await Absence.updateMany(
      { justificationId: id },
      { $set: { status: "unjustified" } }
    );
  }

  return justification;
};

const updateJustificationFile = async (id, data) => {
  return await Justification.findByIdAndUpdate(
    id,
    { documentUrl: data.documentUrl, fileName: data.fileName },
    { new: true }
  );
};

module.exports = {
  createAbsence,
  getAbsences,
  updateAbsence,
  getTeacherClassesAbsences,
  getClassAbsences,
  markAbsence,
  updateTeacherAbsence,
  getPendingTeacherJustifications,
  reviewTeacherJustification,
  createJustification,
  getJustifications,
  reviewJustification,
  updateJustificationFile,
};
