import mongoose from 'mongoose';

const organizationSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'default',
    },
    organizationName: {
      type: String,
      default: 'WorkTrack Corp',
      trim: true,
      maxlength: 120,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    workStartTime: {
      type: String, // HH:mm
      default: '09:00',
      match: /^\d{2}:\d{2}$/,
    },
    workEndTime: {
      type: String, // HH:mm
      default: '18:00',
      match: /^\d{2}:\d{2}$/,
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 180,
    },
    defaultLeaveQuotas: {
      annual: { type: Number, default: 18, min: 0 },
      sick: { type: Number, default: 10, min: 0 },
      casual: { type: Number, default: 6, min: 0 },
    },
    performanceWeights: {
      taskCompletion: { type: Number, default: 30, min: 0, max: 100 },
      onTimeCompletion: { type: Number, default: 25, min: 0, max: 100 },
      approvalRate: { type: Number, default: 20, min: 0, max: 100 },
      attendanceRate: { type: Number, default: 15, min: 0, max: 100 },
      feedbackRating: { type: Number, default: 10, min: 0, max: 100 },
    },
    maxUploadSizeMb: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
  },
  { timestamps: true }
);

export const OrganizationSettings = mongoose.model('OrganizationSettings', organizationSettingsSchema);
