import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const WhaleWallLogSchema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    exchange: { type: String, default: 'binance-futures', index: true },
    side: { type: String, enum: ['BID', 'ASK'], required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    notional_usdt: { type: Number, required: true, index: true },
    threshold_usdt: { type: Number, required: true },

    // Dedupe key (symbol+side+roundedPrice+bucketTs)
    event_key: { type: String, required: true, unique: true },

    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

WhaleWallLogSchema.index({ symbol: 1, created_at: -1 });

export type WhaleWallLogDoc = InferSchemaType<typeof WhaleWallLogSchema>;

export default (mongoose.models.WhaleWallLog as Model<WhaleWallLogDoc>) ||
  mongoose.model<WhaleWallLogDoc>('WhaleWallLog', WhaleWallLogSchema);
