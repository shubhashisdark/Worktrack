import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema(
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
    completedWork: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    ongoingWork: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    blockers: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    nextDayPlan: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    relatedTaskIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
    },
    hoursWorked: {
      type: Number,
      min: 0,
      max: 24,
      default: 8,
    },
    managerNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1500,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

dailyReportSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
