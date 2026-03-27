const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

roleSchema.index({ name: 1, schoolId: 1 }, { unique: true });

const permissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    module: {
      type: String, // students, teachers, grades, etc.
      required: true,
    },
    canCreate: { type: Boolean, default: false },
    canRead: { type: Boolean, default: false },
    canUpdate: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

permissionSchema.index({ roleId: 1, module: 1 }, { unique: true });

const userRoleAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userRoleAssignmentSchema.index({ userId: 1, roleId: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);
const Permission = mongoose.model("Permission", permissionSchema);
const UserRoleAssignment = mongoose.model("UserRoleAssignment", userRoleAssignmentSchema);

module.exports = { Role, Permission, UserRoleAssignment };
