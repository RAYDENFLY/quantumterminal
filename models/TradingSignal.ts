import mongoose, { Schema, Document } from 'mongoose';

export interface ITradingSignal extends Document {
  title: string;
  description?: string;
  author: string;
  asset: string;
  signal: 'LONG' | 'SHORT';
  tradingStyle: 'swing-trade' | 'scalping' | 'position-trading' | 'long-term-investing' | 'trend-following' | 'mean-reversion' | 'range-trading';
  conviction: number; // 1-10
  signalStatus: 'active' | 'sl' | 'tp1' | 'tp2' | 'tp3' | 'closed';
  entry: string;
  stopLoss: string;
  takeProfit1?: string;
  takeProfit2?: string;
  takeProfit3?: string;
  reasoning?: string;
  link?: string;
  imageUrl?: string;
  tags?: string[];
  messageId?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TradingSignalSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    asset: {
      type: String,
      required: [true, 'Asset is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Asset symbol cannot exceed 20 characters']
    },
    signal: {
      type: String,
      required: [true, 'Signal direction is required'],
      enum: ['LONG', 'SHORT']
    },
    tradingStyle: {
      type: String,
      required: [true, 'Trading style is required'],
      enum: ['swing-trade', 'scalping', 'position-trading', 'long-term-investing', 'trend-following', 'mean-reversion', 'range-trading']
    },
    conviction: {
      type: Number,
      required: [true, 'Conviction level is required'],
      min: [1, 'Conviction must be at least 1'],
      max: [10, 'Conviction cannot exceed 10']
    },
    signalStatus: {
      type: String,
      required: [true, 'Signal status is required'],
      enum: ['active', 'sl', 'tp1', 'tp2', 'tp3', 'closed'],
      default: 'active'
    },
    entry: {
      type: String,
      required: [true, 'Entry price is required'],
      trim: true
    },
    stopLoss: {
      type: String,
      required: [true, 'Stop loss is required'],
      trim: true
    },
    takeProfit1: {
      type: String,
      trim: true,
      default: ''
    },
    takeProfit2: {
      type: String,
      trim: true,
      default: ''
    },
    takeProfit3: {
      type: String,
      trim: true,
      default: ''
    },
    reasoning: {
      type: String,
      trim: true,
      maxlength: [500, 'Reasoning cannot exceed 500 characters'],
      default: ''
    },
    link: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      },
      default: ''
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    messageId: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: String,
      trim: true
    },
    approvedAt: {
      type: Date
    },
    rejectedReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
TradingSignalSchema.index({ status: 1, createdAt: -1 });
TradingSignalSchema.index({ asset: 1, signal: 1 });
TradingSignalSchema.index({ tradingStyle: 1 });
TradingSignalSchema.index({ author: 1 });

export default mongoose.models.TradingSignal || mongoose.model<ITradingSignal>('TradingSignal', TradingSignalSchema);
