import mongoose from 'mongoose';

const taskAssignmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'revision_requested', 'approved'],
      default: 'assigned',
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskAssignmentSchema.index({ taskId: 1, employeeId: 1 }, { unique: true });
taskAssignmentSchema.index({ employeeId: 1, status: 1 });

export const TaskAssignment = mongoose.model('TaskAssignment', taskAssignmentSchema);
