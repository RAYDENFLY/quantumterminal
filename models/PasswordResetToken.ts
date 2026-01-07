import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL index: automatically delete expired reset tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = InferSchemaType<typeof PasswordResetTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

const PasswordResetToken: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDoc>) ||
  mongoose.model<PasswordResetTokenDoc>('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
