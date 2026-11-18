import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
      index: true,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    leaveBalances: {
      annual: { type: Number, default: 18, min: 0 },
      sick: { type: Number, default: 10, min: 0 },
      casual: { type: Number, default: 6, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeCode: 'text', jobTitle: 'text' });

export const Employee = mongoose.model('Employee', employeeSchema);
