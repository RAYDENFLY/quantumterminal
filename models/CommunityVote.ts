import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CommunityVoteSchema = new Schema(
  {
    targetType: { type: String, enum: ['post'], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Ensure one vote per user per target
CommunityVoteSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });
CommunityVoteSchema.index({ userId: 1, createdAt: -1 });

export type CommunityVoteDoc = InferSchemaType<typeof CommunityVoteSchema> & {
  _id: mongoose.Types.ObjectId;
};

const CommunityVote: Model<CommunityVoteDoc> =
  (mongoose.models.CommunityVote as Model<CommunityVoteDoc>) ||
  mongoose.model<CommunityVoteDoc>('CommunityVote', CommunityVoteSchema);

export default CommunityVote;
