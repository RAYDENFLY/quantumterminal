import mongoose, { Schema, Document } from 'mongoose';

export interface ILearning extends Document {
  title: string;
  description?: string;
  author: string;
  link: string;
  pdfUrl?: string;
  imageUrl?: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  difficulty: number;
  tags?: string[];
  messageId?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: false,
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
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    pdfUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+\.pdf$/i.test(v);
        },
        message: 'Please provide a valid PDF URL'
      }
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['beginner', 'intermediate', 'advanced'],
      lowercase: true
    },
    difficulty: {
      type: Number,
      required: [true, 'Difficulty is required'],
      min: [1, 'Difficulty must be at least 1'],
      max: [10, 'Difficulty cannot exceed 10']
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    messageId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
LearningSchema.index({ createdAt: -1 });
LearningSchema.index({ author: 1 });
LearningSchema.index({ category: 1 });
LearningSchema.index({ difficulty: 1 });
LearningSchema.index({ tags: 1 });
LearningSchema.index({ status: 1 });
LearningSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Learning || mongoose.model<ILearning>('Learning', LearningSchema);
