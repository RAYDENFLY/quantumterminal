import mongoose, { Schema, Document } from 'mongoose';

export interface ISignals extends Document {
  title: string;
  description: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  target?: number;
  stopLoss?: number;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  performance?: {
    pnl: number;
    percentage: number;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SignalsSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Symbol cannot exceed 10 characters']
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['BUY', 'SELL', 'HOLD'],
      uppercase: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    target: {
      type: Number,
      min: [0, 'Target must be positive']
    },
    stopLoss: {
      type: Number,
      min: [0, 'Stop loss must be positive']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['ACTIVE', 'CLOSED', 'EXPIRED'],
      uppercase: true,
      default: 'ACTIVE'
    },
    performance: {
      pnl: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
SignalsSchema.index({ createdAt: -1 });
SignalsSchema.index({ symbol: 1 });
SignalsSchema.index({ type: 1 });
SignalsSchema.index({ status: 1 });
SignalsSchema.index({ tags: 1 });
SignalsSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Signals || mongoose.model<ISignals>('Signals', SignalsSchema);
