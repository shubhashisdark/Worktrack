import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    notificationPrefs: {
      taskAssigned: { type: Boolean, default: true },
      taskApproved: { type: Boolean, default: true },
      revisionRequested: { type: Boolean, default: true },
      leaveUpdates: { type: Boolean, default: true },
      dailyReportReminders: { type: Boolean, default: true },
      feedbackReceived: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    notificationPrefs: this.notificationPrefs,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
