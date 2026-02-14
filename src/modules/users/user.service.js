const User = require("./users.model");

/* =====================================================
   GET ALL USERS
===================================================== */
const getAllUsers = async (query = {}) => {
  const { schoolId, role, status, page = 1, limit = 10 } = query;
  
  const filter = {};
  if (schoolId) filter.school = schoolId;
  if (role) filter.role = role;
  if (status !== undefined) filter.isActive = status === "active";

  const users = await User.find(filter)
    .populate("school", "name")
    .select("-password -otpCode -otpExpires")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await User.countDocuments(filter);

  return { users, total, pagination: { page: Number(page), limit: Number(limit), total } };
};

/* =====================================================
   GET USER BY ID
===================================================== */
const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("school", "name")
    .select("-password -otpCode -otpExpires")
    .lean();
  
  if (!user) throw { statusCode: 404, message: "Utilisateur introuvable" };
  return user;
};

/* =====================================================
   CREATE USER
===================================================== */
const createUser = async (data) => {
  const { email, password, name, role, schoolId, permissions } = data;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { statusCode: 400, message: "Cet email est déjà utilisé" };
  }

  const user = new User({
    email,
    password,
    name,
    role,
    school: schoolId || null,
    permissions: permissions || [],
    isActive: true,
  });

  await user.save();

  // Return user without password
  const savedUser = await User.findById(user._id)
    .select("-password -otpCode -otpExpires")
    .lean();

  return savedUser;
};

/* =====================================================
   UPDATE USER
===================================================== */
const updateUser = async (id, data) => {
  const { password, ...updateData } = data;

  // If password is being updated, hash it
  if (password) {
    const user = await User.findById(id);
    if (!user) throw { statusCode: 404, message: "Utilisateur introuvable" };
    user.password = password;
    await user.save();
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-password -otpCode -otpExpires")
    .lean();
  
  if (!user) throw { statusCode: 404, message: "Utilisateur introuvable" };
  return user;
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw { statusCode: 404, message: "Utilisateur introuvable" };

  await User.deleteOne({ _id: id });
  return true;
};

/* =====================================================
   UPDATE USER STATUS
===================================================== */
const updateUserStatus = async (id, isActive) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  )
    .select("-password -otpCode -otpExpires")
    .lean();
  
  if (!user) throw { statusCode: 404, message: "Utilisateur introuvable" };
  return user;
};

/* =====================================================
   GET USERS BY SCHOOL
===================================================== */
const getUsersBySchool = async (schoolId) => {
  return await User.find({ school: schoolId })
    .select("-password -otpCode -otpExpires")
    .lean();
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
