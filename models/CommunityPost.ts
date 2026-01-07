import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

export const COMMUNITY_CATEGORIES = ['discussion', 'coin-analysis', 'jobs', 'resources'] as const;
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

const CoinTagSchema = new Schema(
  {
    coinId: { type: String, required: true }, // CoinGecko coin id (e.g. bitcoin)
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' }, // optional icon url
  },
  { _id: false }
);

const CommunityPostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorEmail: { type: String, required: true }, // denormalized for faster lists

    category: { type: String, enum: COMMUNITY_CATEGORIES, required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 20000 },

    coinTags: { type: [CoinTagSchema], default: [] },

    slug: { type: String, required: true, unique: true, index: true },

    commentsCount: { type: Number, default: 0 },
    upvotesCount: { type: Number, default: 0 },

    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active', index: true },
    lastCommentAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ category: 1, createdAt: -1 });
CommunityPostSchema.index({ status: 1, createdAt: -1 });
CommunityPostSchema.index({ status: 1, upvotesCount: -1, createdAt: -1 });
CommunityPostSchema.index({ category: 1, status: 1, upvotesCount: -1, createdAt: -1 });

export type CommunityPostDoc = InferSchemaType<typeof CommunityPostSchema> & {
  _id: mongoose.Types.ObjectId;
};

const CommunityPost: Model<CommunityPostDoc> =
  (mongoose.models.CommunityPost as Model<CommunityPostDoc>) ||
  mongoose.model<CommunityPostDoc>('CommunityPost', CommunityPostSchema);

export default CommunityPost;
