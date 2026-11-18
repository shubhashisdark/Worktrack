import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'unpaid', 'other'],
      required: true,
      default: 'annual',
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    decisionNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
