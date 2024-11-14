export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum RecurrenceInterval {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface ITransaction {
  _id: string;
  userId: string;
  amount: number;
  description: string;
  type: TransactionType;
  date: Date;
  isRecurring: boolean;
  recurrenceInterval?: RecurrenceInterval;
  recurrenceEndDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 