import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    sizeBytes: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'assigned', 'in_progress', 'submitted', 'revision_requested', 'approved', 'archived'],
      default: 'created',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    attachments: {
      type: [attachmentSchema],
      validate: [(v) => v.length <= 10, 'Maximum 10 reference attachments allowed'],
      default: [],
    },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      validate: [(v) => v.length <= 10, 'Maximum 10 tags allowed'],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text', taskCode: 'text' });

export const Task = mongoose.model('Task', taskSchema);
