const Attendance = require("./attendance.model");

/* =====================================================
   CREATE/UPDATE ATTENDANCE
===================================================== */
const updateOrCreateAttendance = async (data) => {
  const { studentId, courseId, date } = data;
  
  // Normalize date to YYYY-MM-DD
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return await Attendance.findOneAndUpdate(
    { studentId, courseId, date: normalizedDate },
    { $set: { ...data, date: normalizedDate } },
    { upsert: true, new: true, runValidators: true }
  );
};

/* =====================================================
   BULK CREATE ATTENDANCE
===================================================== */
const bulkCreateAttendance = async (attendanceArray) => {
  const operations = attendanceArray.map(a => {
    const normalizedDate = new Date(a.date);
    normalizedDate.setHours(0, 0, 0, 0);
    return {
      updateOne: {
        filter: { studentId: a.studentId, courseId: a.courseId, date: normalizedDate },
        update: { $set: { ...a, date: normalizedDate } },
        upsert: true
      }
    };
  });
  return await Attendance.bulkWrite(operations);
};

/* =====================================================
   SCAN ATTENDANCE (QR CODE)
===================================================== */
const scanAttendance = async (studentId, courseId) => {
  const now = new Date();
  const normalizedDate = new Date(now);
  normalizedDate.setHours(0, 0, 0, 0);

  return await Attendance.findOneAndUpdate(
    { studentId, courseId, date: normalizedDate },
    { 
      $set: { 
        status: "PRESENT", 
        scanTime: now, 
        date: normalizedDate 
      } 
    },
    { upsert: true, new: true }
  );
};

/* =====================================================
   GET ATTENDANCE
===================================================== */
const getAttendance = async (query = {}) => {
  const { studentId, courseId, date } = query;
  const filter = {};

  if (studentId) filter.studentId = studentId;
  if (courseId) filter.courseId = courseId;
  if (date) {
    const start = new Date(date);
    start.setHours(0,0,0,0);
    filter.date = start;
  }

  return await Attendance.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate({
      path: "courseId",
      populate: { path: "subjectId", select: "name" }
    })
    .sort({ date: -1 })
    .lean();
};

/* =====================================================
   GET STATS
===================================================== */
const getStats = async (studentId) => {
  const records = await Attendance.find({ studentId }).lean();
  const total = records.length;
  if (total === 0) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 };

  const stats = records.reduce((acc, curr) => {
    acc[curr.status.toLowerCase()]++;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0 });

  return {
    total,
    ...stats,
    rate: ((stats.present + stats.late) / total) * 100
  };
};

module.exports = {
  updateOrCreateAttendance,
  bulkCreateAttendance,
  scanAttendance,
  getAttendance,
  getStats,
};
