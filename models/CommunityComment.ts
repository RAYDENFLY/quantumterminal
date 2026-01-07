import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CommunityCommentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'CommunityComment', default: null, index: true },

    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorEmail: { type: String, required: true },

    body: { type: String, required: true, trim: true, maxlength: 10000 },
    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active', index: true },
  },
  { timestamps: true }
);

CommunityCommentSchema.index({ postId: 1, createdAt: 1 });

export type CommunityCommentDoc = InferSchemaType<typeof CommunityCommentSchema> & {
  _id: mongoose.Types.ObjectId;
};

const CommunityComment: Model<CommunityCommentDoc> =
  (mongoose.models.CommunityComment as Model<CommunityCommentDoc>) ||
  mongoose.model<CommunityCommentDoc>('CommunityComment', CommunityCommentSchema);

export default CommunityComment;
