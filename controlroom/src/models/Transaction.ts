import mongoose, { Schema } from 'mongoose';
import { ITransaction, TransactionType, RecurrenceInterval } from '@/types/transaction';

// Delete any existing model to ensure clean slate
delete mongoose.models.Transaction;

const transactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  date: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  recurrenceInterval: { 
    type: String, 
    enum: Object.values(RecurrenceInterval), 
    default: RecurrenceInterval.NONE 
  },
  recurrenceEndDate: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      ret._id = ret._id.toString();
      ret.date = ret.date.toISOString();
      if (ret.recurrenceEndDate) {
        ret.recurrenceEndDate = ret.recurrenceEndDate.toISOString();
      }
      if (ret.createdAt) {
        ret.createdAt = ret.createdAt.toISOString();
      }
      if (ret.updatedAt) {
        ret.updatedAt = ret.updatedAt.toISOString();
      }
      return ret;
    }
  }
});

// Create and export the model
const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction; 