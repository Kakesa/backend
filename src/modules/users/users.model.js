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

    role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], default: 'student', index: true },

    permissions: { type: [permissionSchema], default: [] },

    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },

    isActive: { type: Boolean, default: false }, // 🔹 inactif par défaut, activation par mail
    activationToken: { type: String },           // 🔹 token d’activation
    activationExpires: { type: Date },           // 🔹 expiration du token
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
  if (!this.isModified('password')) return; // ne fait rien si mot de passe pas modifié

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
