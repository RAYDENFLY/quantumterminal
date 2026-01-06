import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: string;
  adminEmail: string;
  action: 'approve' | 'reject' | 'delete' | 'create' | 'update';
  targetType: 'research' | 'learning' | 'academy' | 'market-update' | 'trading-signals';
  targetId: string;
  targetTitle: string;
  reason: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  adminId: {
    type: String,
    required: [true, 'Admin ID is required']
  },
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required']
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'delete', 'create', 'update'],
    required: [true, 'Action is required']
  },
  targetType: {
    type: String,
    enum: ['research', 'learning', 'academy', 'market-update', 'trading-signals'],
    required: [true, 'Target type is required']
  },
  targetId: {
    type: String,
    required: [true, 'Target ID is required']
  },
  targetTitle: {
    type: String,
    required: [true, 'Target title is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required']
  },
  details: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
auditLogSchema.index({ adminEmail: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
