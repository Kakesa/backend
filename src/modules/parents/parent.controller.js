const parentService = require("./parent.service");

/* =====================================================
   GET ALL PARENTS
===================================================== */
const getAllParents = async (req, res, next) => {
  try {
    const schoolId = req.user.school || req.user.schoolId;
    const data = await parentService.getAllParents({ schoolId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET PARENT BY ID
===================================================== */
const getParentById = async (req, res, next) => {
  try {
    const data = await parentService.getParentById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE PARENT
===================================================== */
const createParent = async (req, res, next) => {
  try {
    const data = { ...req.body, schoolId: req.user.school || req.user.schoolId };
    const parent = await parentService.createParent(data, true);
    res.status(201).json({ success: true, data: parent });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   LINK CHILD
===================================================== */
const linkChild = async (req, res, next) => {
  try {
    const { parentId, studentId, relation } = req.body;
    const data = await parentService.linkChild(parentId, studentId, relation);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE PARENT
===================================================== */
const updateParent = async (req, res, next) => {
  try {
    const data = await parentService.updateParent(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE PARENT
===================================================== */
const deleteParent = async (req, res, next) => {
  try {
    await parentService.deleteParent(req.params.id);
    res.status(200).json({ success: true, message: "Parent supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllParents,
  getParentById,
  createParent,
  linkChild,
  updateParent,
  deleteParent,
};
