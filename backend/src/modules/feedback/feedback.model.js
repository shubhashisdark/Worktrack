import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    category: {
      type: String,
      enum: ['task_review', 'performance', 'recognition', 'improvement', 'general'],
      default: 'general',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ employeeId: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
