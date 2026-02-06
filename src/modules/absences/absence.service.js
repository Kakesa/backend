const Absence = require("./absence.model");
const Justification = require("./justification.model");

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

module.exports = {
  createAbsence,
  getAbsences,
  updateAbsence,
  createJustification,
  getJustifications,
  reviewJustification,
};
