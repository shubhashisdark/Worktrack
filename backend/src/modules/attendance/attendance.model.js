import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    checkInAt: {
      type: Date,
      required: true,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    workingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'half_day', 'absent', 'on_leave', 'missing_checkout'],
      default: 'present',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
