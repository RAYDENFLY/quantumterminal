import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketUpdate extends Document {
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  type: 'news' | 'analysis' | 'alert' | 'announcement';
  publishDate?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketUpdateSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Please provide a valid image URL'
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['news', 'analysis', 'alert', 'announcement'],
      default: 'news'
    },
    publishDate: {
      type: Date,
      default: null
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
MarketUpdateSchema.index({ createdAt: -1 });
MarketUpdateSchema.index({ status: 1 });
MarketUpdateSchema.index({ priority: 1 });
MarketUpdateSchema.index({ type: 1 });
MarketUpdateSchema.index({ author: 1 });
MarketUpdateSchema.index({ tags: 1 });
MarketUpdateSchema.index({ publishDate: -1 });
MarketUpdateSchema.index({ title: 'text', content: 'text' });

// Virtual for checking if update is published
MarketUpdateSchema.virtual('isPublished').get(function() {
  return this.status === 'approved' && this.publishDate && this.publishDate <= new Date();
});

export default mongoose.models.MarketUpdate || mongoose.model<IMarketUpdate>('MarketUpdate', MarketUpdateSchema);
