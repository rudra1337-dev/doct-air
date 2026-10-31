import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['PATIENT', 'PROFESSIONAL', 'ADMIN'],
        message: '{VALUE} is not a supported role',
      },
      default: 'PATIENT',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Extended Patient & Clinical Profile Fields
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
      trim: true,
    },
    gender: {
      type: String,
      default: '',
      trim: true,
    },
    bloodGroup: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    // Healthcare Professional specific fields
    specialty: {
      type: String,
      default: '',
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    qualifications: {
      type: String,
      default: '',
      trim: true,
    },
    hospitalAffiliation: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method: Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method: Return safe user object omitting passwordHash and internal fields
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    phone: this.phone || '',
    dateOfBirth: this.dateOfBirth || '',
    gender: this.gender || '',
    bloodGroup: this.bloodGroup || '',
    address: this.address || '',
    emergencyContact: this.emergencyContact || { name: '', phone: '', relationship: '' },
    allergies: this.allergies || [],
    chronicConditions: this.chronicConditions || [],
    specialty: this.specialty || '',
    licenseNumber: this.licenseNumber || '',
    qualifications: this.qualifications || '',
    hospitalAffiliation: this.hospitalAffiliation || '',
    department: this.department || '',
    yearsOfExperience: this.yearsOfExperience ?? null,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// JSON serialization transform
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
