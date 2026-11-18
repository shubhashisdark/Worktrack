import mongoose from 'mongoose';

const deliverableFileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const deliverableSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    files: {
      type: [deliverableFileSchema],
      validate: [(v) => v.length <= 10, 'Maximum 10 files per deliverable'],
      default: [],
    },
    externalLinks: {
      type: [
        {
          label: { type: String, trim: true, maxlength: 100 },
          url: { type: String, trim: true, maxlength: 500 },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'revision_requested'],
      default: 'pending_review',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

deliverableSchema.index({ assignmentId: 1, version: -1 });
deliverableSchema.index({ status: 1, submittedAt: -1 });

export const Deliverable = mongoose.model('Deliverable', deliverableSchema);
