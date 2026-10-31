import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['PATIENT', 'PROFESSIONAL', 'ADMIN', 'all'],
      default: 'all',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['case_update', 'report_published', 'triage_alert', 'clinical_alert', 'general', 'system'],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'general',
    },
    link: {
      type: String,
      default: null,
      trim: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual alias for recipient <-> userId
notificationSchema.virtual('recipient')
  .get(function () {
    return this.userId;
  })
  .set(function (val) {
    this.userId = val;
  });

// Virtual alias for read <-> isRead
notificationSchema.virtual('read')
  .get(function () {
    return this.isRead;
  })
  .set(function (val) {
    this.isRead = val;
  });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.userId = ret.userId?.toString();
    ret.recipient = ret.userId;
    ret.read = Boolean(ret.isRead);
    ret.isRead = Boolean(ret.isRead);
    if (ret.caseId) ret.caseId = ret.caseId.toString();
    if (ret.conversationId) ret.conversationId = ret.conversationId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
