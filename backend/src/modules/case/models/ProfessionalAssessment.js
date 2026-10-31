import mongoose from 'mongoose';

/**
 * Professional Assessment & Doctor's Final Report Schema
 *
 * Authored exclusively by a qualified healthcare professional.
 * Contains clinician-verified observations, diagnosis, prescriptions,
 * recommended investigations, advice, and explicit review acknowledgement.
 *
 * AI NEVER auto-populates diagnosis or prescriptions.
 */
const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [200, 'Medication name cannot exceed 200 characters'],
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: [100, 'Dosage cannot exceed 100 characters'],
      default: null,
    },
    frequency: {
      type: String,
      trim: true,
      maxlength: [100, 'Frequency cannot exceed 100 characters'],
      default: null,
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [100, 'Duration cannot exceed 100 characters'],
      default: null,
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
      default: null,
    },
  },
  { _id: true }
);

const referralSchema = new mongoose.Schema(
  {
    recommended: {
      type: Boolean,
      default: false,
    },
    specialty: {
      type: String,
      trim: true,
      maxlength: [150, 'Specialty cannot exceed 150 characters'],
      default: null,
    },
    facility: {
      type: String,
      trim: true,
      maxlength: [200, 'Facility name cannot exceed 200 characters'],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Referral notes cannot exceed 1000 characters'],
      default: null,
    },
  },
  { _id: false }
);

const professionalAssessmentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Professional ID is required'],
      index: true,
    },
    professionalName: {
      type: String,
      trim: true,
      default: 'Attending Clinician',
    },
    professionalTitle: {
      type: String,
      trim: true,
      default: 'Medical Officer / Physician',
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: '{VALUE} is not a valid assessment status',
      },
      default: 'draft',
      index: true,
    },

    // ── Clinical Assessment Fields (Authored by Clinician) ────────────────
    observations: {
      type: String,
      trim: true,
      maxlength: [5000, 'Observations cannot exceed 5000 characters'],
      default: '',
    },
    clinicalAssessment: {
      type: String,
      trim: true,
      maxlength: [5000, 'Clinical assessment cannot exceed 5000 characters'],
      default: '',
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
      default: '',
    },
    recommendedInvestigations: {
      type: [String],
      default: [],
    },
    prescriptions: {
      type: [prescriptionItemSchema],
      default: [],
    },
    generalAdvice: {
      type: String,
      trim: true,
      maxlength: [5000, 'General advice cannot exceed 5000 characters'],
      default: '',
    },
    followUpInstructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Follow-up instructions cannot exceed 2000 characters'],
      default: '',
    },
    referral: {
      type: referralSchema,
      default: () => ({}),
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Additional notes cannot exceed 2000 characters'],
      default: '',
    },

    // ── Clinician Review Acknowledgement ──────────────────────────────────
    doctorAcknowledgement: {
      confirmed: {
        type: Boolean,
        default: false,
      },
      timestamp: {
        type: Date,
        default: null,
      },
      statement: {
        type: String,
        default: null,
      },
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
professionalAssessmentSchema.index({ caseId: 1, status: 1 });
professionalAssessmentSchema.index({ patientId: 1, status: 1, publishedAt: -1 });

// Clean JSON transform
professionalAssessmentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.caseId = ret.caseId?.toString();
    ret.conversationId = ret.conversationId?.toString();
    ret.patientId = ret.patientId?.toString();
    ret.professionalId = ret.professionalId?.toString();
    if (Array.isArray(ret.prescriptions)) {
      ret.prescriptions = ret.prescriptions.map((p) => {
        const item = { ...p };
        if (item._id) {
          item.id = item._id.toString();
          delete item._id;
        }
        return item;
      });
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ProfessionalAssessment = mongoose.model(
  'ProfessionalAssessment',
  professionalAssessmentSchema
);

export default ProfessionalAssessment;
