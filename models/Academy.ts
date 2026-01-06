import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademy extends Document {
  title: string;
  deskripsi: string;
  author: string;
  link: string;
  pdfUrl?: string;
  imageUrl?: string;
  type: 'course' | 'tutorial' | 'guide' | 'workshop';
  tags?: string[];
  messageId?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AcademySchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    deskripsi: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
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
          if (!v) return true; // Optional field
          // Allow PDF URLs with or without query parameters
          // Match .pdf extension before query params or at end of URL
          return /^https?:\/\/.+\.pdf(\?.*)?$/i.test(v) || 
                 // Or Discord CDN URLs (they serve PDFs even without .pdf extension)
                 /^https:\/\/cdn\.discord(app)?\.com\/attachments\/.+/i.test(v);
        },
        message: 'Please provide a valid PDF URL'
      }
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Allow image URLs with or without query parameters
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v) ||
                 // Or common image hosting services
                 /^https:\/\/(i\.ibb\.co|cdn\.discord(app)?\.com|imgur\.com|i\.imgur\.com)\/.+/i.test(v);
        },
        message: 'Please provide a valid image URL'
      }
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['course', 'tutorial', 'guide', 'workshop'],
      lowercase: true,
      default: 'course'
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
AcademySchema.index({ createdAt: -1 });
AcademySchema.index({ author: 1 });
AcademySchema.index({ type: 1 });
AcademySchema.index({ tags: 1 });
AcademySchema.index({ status: 1 });
AcademySchema.index({ title: 'text', deskripsi: 'text' });

export default mongoose.models.Academy || mongoose.model<IAcademy>('Academy', AcademySchema);
