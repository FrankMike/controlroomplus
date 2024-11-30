'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ITransaction } from '@/types/transaction';
import TransactionModal from '@/components/TransactionModal';
import { 
  getTransactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '@/app/actions/transactionActions';

export default function FinancePage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [yearlyStats, setYearlyStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadTransactions();
    }
  }, [status]);

  const calculateMonthlyStats = (transactions: ITransaction[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const stats = monthlyTransactions.reduce((acc, transaction) => {
      const amount = Math.abs(transaction.amount);
      if (transaction.type === 'CREDIT') {
        acc.totalIncome += amount;
        acc.balance += amount;
      } else {
        acc.totalExpenses += amount;
        acc.balance -= amount;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0
    });

    setMonthlyStats(stats);
  };

  const calculateYearlyStats = (transactions: ITransaction[]) => {
    const currentYear = new Date().getFullYear();

    const yearlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === currentYear;
    });

    const stats = yearlyTransactions.reduce((acc, transaction) => {
      const amount = Math.abs(transaction.amount);
      if (transaction.type === 'CREDIT') {
        acc.totalIncome += amount;
        acc.balance += amount;
      } else {
        acc.totalExpenses += amount;
        acc.balance -= amount;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0
    });

    setYearlyStats(stats);
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
      calculateMonthlyStats(data);
      calculateYearlyStats(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleAddTransaction = async (formData: Partial<ITransaction>) => {
    try {
      await addTransaction(formData);
      setIsModalOpen(false);
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleEditTransaction = async (formData: Partial<ITransaction>) => {
    if (!editingTransaction?._id) return;
    try {
      await updateTransaction(editingTransaction._id, formData);
      setIsModalOpen(false);
      setEditingTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
    
    return type === 'CREDIT' ? formattedAmount : `-${formattedAmount}`;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-right mb-6">
        <p className="text-gray-600">{getCurrentDate()}</p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Monthly Income</h2>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(monthlyStats.totalIncome)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Monthly Expenses</h2>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(monthlyStats.totalExpenses)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Monthly Balance</h2>
              <p className={`text-2xl font-bold ${monthlyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(monthlyStats.balance)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Yearly Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Yearly Income</h2>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(yearlyStats.totalIncome)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Yearly Expenses</h2>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(yearlyStats.totalExpenses)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm text-gray-500 uppercase mb-2">Yearly Balance</h2>
              <p className={`text-2xl font-bold ${yearlyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(yearlyStats.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center my-8">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500"
        >
          Add Transaction
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                  transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatAmount(transaction.amount, transaction.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingTransaction(transaction);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
