'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Transaction from '@/models/Transaction';
import { connectToDatabase } from '@/lib/mongodb';
import { ITransaction } from '@/types/transaction';

export async function getTransactions(): Promise<ITransaction[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    const transactions = await Transaction.find({ 
      userId: session.user.id 
    }).sort({ date: -1 });

    return JSON.parse(JSON.stringify(transactions));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function addTransaction(transaction: Partial<ITransaction>): Promise<ITransaction> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    const newTransaction = new Transaction({
      ...transaction,
      userId: session.user.id,
      date: new Date(transaction.date!),
    });
    await newTransaction.save();
    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, transaction: Partial<ITransaction>): Promise<ITransaction> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    
    const updateData = {
      ...transaction,
      date: transaction.date ? new Date(transaction.date) : undefined,
    };

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updateData,
      { new: true }
    );
    
    if (!updatedTransaction) {
      throw new Error('Transaction not found');
    }

    return JSON.parse(JSON.stringify(updatedTransaction));
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await connectToDatabase();
    const result = await Transaction.deleteOne({ _id: id, userId: session.user.id });
    
    if (result.deletedCount === 0) {
      throw new Error('Transaction not found');
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
} 