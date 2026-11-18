import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_submitted',
        'task_approved',
        'revision_requested',
        'task_comment',
        'leave_submitted',
        'leave_approved',
        'leave_rejected',
        'feedback_received',
        'daily_report_reviewed',
        'system',
      ],
      required: true,
      default: 'system',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    entityType: {
      type: String,
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    actionUrl: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
