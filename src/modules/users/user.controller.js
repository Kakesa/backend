const userService = require("./user.service");

/* =====================================================
   GET ALL USERS
===================================================== */
const getAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET USER BY ID
===================================================== */
const getUserById = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE USER
===================================================== */
const createUser = async (req, res, next) => {
  try {
    const data = await userService.createUser(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE USER
===================================================== */
const updateUser = async (req, res, next) => {
  try {
    const data = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: "Utilisateur supprimé" });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE USER STATUS
===================================================== */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const data = await userService.updateUserStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET USERS BY SCHOOL
===================================================== */
const getUsersBySchool = async (req, res, next) => {
  try {
    const data = await userService.getUsersBySchool(req.params.schoolId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUsersBySchool,
};
