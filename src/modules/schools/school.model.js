const mongoose = require("mongoose");

/* ================================
   SUBSCRIPTION SCHEMA (EMBEDDED)
================================ */
const subscriptionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["free", "trial", "active", "expired", "pending"],
      default: "free",
    },
    plan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      default: "basic",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/* ================================
   SCHOOL SCHEMA
================================ */
const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    academicYear: {
      type: String,
      required: true,
      default: "2026-2027",
    },

    type: {
      type: String,
      default: "secondary",
      enum: ["primary", "secondary", "highschool", "technical", "university"],
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* ================================
       SCHOOL STATUS (SUPER ADMIN)
    ================================ */
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },


    /* ================================
       SUBSCRIPTION
    ================================ */
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },

    /* ================================
       OWNERSHIP & RELATIONS
    ================================ */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],

    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],

    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("School", schoolSchema);
