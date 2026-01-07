import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CommunityReportSchema = new Schema(
  {
    targetType: { type: String, enum: ['post', 'comment'], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },

    reporterId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterEmail: { type: String, default: '' },

    reason: {
      type: String,
      enum: ['spam', 'abuse', 'misinformation', 'scam', 'copyright', 'other'],
      required: true,
      index: true,
    },
    details: { type: String, default: '', maxlength: 2000 },

    status: { type: String, enum: ['open', 'reviewed', 'dismissed'], default: 'open', index: true },
  },
  { timestamps: true }
);

CommunityReportSchema.index({ createdAt: -1 });

export type CommunityReportDoc = InferSchemaType<typeof CommunityReportSchema> & {
  _id: mongoose.Types.ObjectId;
};

const CommunityReport: Model<CommunityReportDoc> =
  (mongoose.models.CommunityReport as Model<CommunityReportDoc>) ||
  mongoose.model<CommunityReportDoc>('CommunityReport', CommunityReportSchema);

export default CommunityReport;
