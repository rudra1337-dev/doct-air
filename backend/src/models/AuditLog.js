import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    userRole: {
      type: String,
      default: 'ANONYMOUS',
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
    },
    resourceId: {
      type: String,
      default: null,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ resourceId: 1, action: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.userId = ret.userId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
