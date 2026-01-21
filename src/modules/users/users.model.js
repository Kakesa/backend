const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* =====================================================
   PERMISSION SCHEMA
===================================================== */
const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

/* =====================================================
   USER SCHEMA
===================================================== */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    phone: { type: String, trim: true, default: '' },

    password: { type: String, required: true, select: false },

    role: { type: String, enum: ['super-admin', 'admin', 'teacher', 'student', 'parent'], default: 'student', index: true },

    permissions: { type: [permissionSchema], default: [] },

    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },

    needsSchoolSetup: {
      type: Boolean,
      default: false,
    },
    /* =========================
       ACTIVATION / OTP
    ========================== */
    isActive: { type: Boolean, default: false },

    otpCode: { type: String, select: false },       // 🔐 jamais exposé
    otpExpires: { type: Date, select: false },     // 🔐 jamais exposé
    otpAttempts: { type: Number, default: 0 },     // nombre de tentatives pour limiter
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =====================================================
   HASH PASSWORD (AVANT SAVE)
===================================================== */
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


/* =====================================================
   COMPARE PASSWORD
===================================================== */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/* =====================================================
   EXPORT
===================================================== */
module.exports = mongoose.model('User', userSchema);
