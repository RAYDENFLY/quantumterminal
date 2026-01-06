import mongoose, { Document, Schema } from 'mongoose';

type DonationCategory = 'project' | 'social' | 'dev_support' | 'exchange_transfer';

type Evidence = {
  type: 'redacted_invoice' | 'public_link' | 'note';
  url?: string;
  note?: string;
} | null;

export interface IDonationOutgoing {
  txHash: string;
  date: Date;
  amountBNB: number;
  category: DonationCategory;
  purpose: string;
  counterparty?: string;
  evidence?: Evidence;
}

export interface IDonationLog extends Document {
  period: string; // YYYY-MM
  network: 'BSC';
  donationWallet: string;

  summary: {
    startingBalanceBNB?: number;
    totalInBNB?: number;
    totalOutBNB?: number;
    endingBalanceBNB?: number;
    statement?: string;
  };

  outgoing: IDonationOutgoing[];

  incoming: {
    mode: 'summary' | 'detailed';
    explorerUrl?: string;
    txHashes?: string[];
  };

  notes?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const evidenceSchema = new Schema(
  {
    type: { type: String, enum: ['redacted_invoice', 'public_link', 'note'], required: true },
    url: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const outgoingSchema = new Schema<IDonationOutgoing>(
  {
    txHash: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    amountBNB: { type: Number, required: true },
    category: {
      type: String,
      enum: ['project', 'social', 'dev_support', 'exchange_transfer'],
      required: true,
      index: true,
    },
    purpose: { type: String, required: true },
    counterparty: { type: String },
    evidence: { type: evidenceSchema, default: null },
  },
  { _id: false }
);

const donationLogSchema = new Schema<IDonationLog>(
  {
    period: { type: String, required: true, unique: true, index: true },
    network: { type: String, enum: ['BSC'], default: 'BSC', required: true },
    donationWallet: { type: String, required: true, index: true },

    summary: {
      startingBalanceBNB: { type: Number },
      totalInBNB: { type: Number },
      totalOutBNB: { type: Number },
      endingBalanceBNB: { type: Number },
      statement: { type: String },
    },

    outgoing: { type: [outgoingSchema], default: [] },

    incoming: {
      mode: { type: String, enum: ['summary', 'detailed'], default: 'summary', required: true },
      explorerUrl: { type: String },
      txHashes: { type: [String], default: undefined },
    },

    notes: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

donationLogSchema.index({ period: -1 });

donationLogSchema.pre('validate', function () {
  // Ensure detailed mode has txHashes, otherwise keep it summary.
  // This prevents accidentally shipping huge arrays without intent.
  if (this.incoming?.mode === 'detailed' && (!this.incoming.txHashes || this.incoming.txHashes.length === 0)) {
    this.invalidate('incoming.txHashes', 'txHashes is required when incoming.mode is detailed');
  }
});

export default mongoose.models.DonationLog || mongoose.model<IDonationLog>('DonationLog', donationLogSchema);
