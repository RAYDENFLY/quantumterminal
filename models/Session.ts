import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const SessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ||
  mongoose.model<SessionDoc>('Session', SessionSchema);

export default Session;
