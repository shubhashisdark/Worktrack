import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    deliverableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverable',
      required: true,
      unique: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskAssignment',
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    decision: {
      type: String,
      enum: ['pending', 'approved', 'revision_requested'],
      default: 'pending',
      index: true,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

approvalSchema.index({ decision: 1, createdAt: -1 });

export const Approval = mongoose.model('Approval', approvalSchema);
