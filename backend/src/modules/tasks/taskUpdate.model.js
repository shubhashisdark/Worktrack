import mongoose from 'mongoose';

const taskUpdateSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskAssignment',
      default: null,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: ['comment', 'progress', 'status_change', 'assignment', 'submission', 'review'],
      required: true,
      default: 'comment',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    previousProgress: { type: Number, default: null },
    newProgress: { type: Number, default: null },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
  },
  { timestamps: true }
);

taskUpdateSchema.index({ taskId: 1, createdAt: -1 });

export const TaskUpdate = mongoose.model('TaskUpdate', taskUpdateSchema);
