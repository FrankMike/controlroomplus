'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ITransaction, TransactionType, RecurrenceInterval } from '@/types/transaction';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactionActions';
import TransactionModal from '@/components/TransactionModal';

export default function FinancePage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (status === 'authenticated') {
        try {
          const data = await getTransactions();
          setTransactions(data);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchData();
  }, [status]);

  const handleSubmit = async (formData: any) => {
    try {
      if (editingTransaction) {
        const updated = await updateTransaction(editingTransaction._id, {
          ...formData,
          amount: Number(formData.amount),
          date: new Date(formData.date),
        });
        setTransactions(transactions.map(t => 
          t._id === updated._id ? updated : t
        ));
      } else {
        const newTransaction = await addTransaction({
          ...formData,
          amount: Number(formData.amount),
          date: new Date(formData.date),
        });
        setTransactions([newTransaction, ...transactions]);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction: ITransaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        setTransactions(transactions.filter(t => t._id !== id));
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const calculateSummary = (transactions: ITransaction[]) => {
    const totalCredits = transactions
      .filter(t => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = transactions
      .filter(t => t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      credits: totalCredits,
      debits: totalDebits,
      balance: totalCredits - totalDebits
    };
  };

  const getMonthSummary = () => {
    const now = new Date();
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    });
    return calculateSummary(monthTransactions);
  };

  const getYearSummary = () => {
    const now = new Date();
    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === now.getFullYear();
    });
    return calculateSummary(yearTransactions);
  };

  const allTimeSummary = calculateSummary(transactions);
  const monthSummary = getMonthSummary();
  const yearSummary = getYearSummary();

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-12">Finance Manager</h1>
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <div className="p-4">Please sign in to access your finances.</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Personal Finance Manager</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Transaction
        </button>
      </div>
      
      {/* All Time Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">All Time Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Total Credits</h3>
            <p className="text-2xl text-green-600">
              ${allTimeSummary.credits.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Total Debits</h3>
            <p className="text-2xl text-red-600">
              ${allTimeSummary.debits.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${
            allTimeSummary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            <h3 className="font-semibold text-sm text-gray-600">Total Balance</h3>
            <p className={`text-2xl ${
              allTimeSummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ${allTimeSummary.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Current Month Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Current Month Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Month Credits</h3>
            <p className="text-2xl text-green-600">
              ${monthSummary.credits.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Month Debits</h3>
            <p className="text-2xl text-red-600">
              ${monthSummary.debits.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${
            monthSummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            <h3 className="font-semibold text-sm text-gray-600">Month Balance</h3>
            <p className={`text-2xl ${
              monthSummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ${monthSummary.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Current Year Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Current Year Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Year Credits</h3>
            <p className="text-2xl text-green-600">
              ${yearSummary.credits.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-600">Year Debits</h3>
            <p className="text-2xl text-red-600">
              ${yearSummary.debits.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${
            yearSummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            <h3 className="font-semibold text-sm text-gray-600">Year Balance</h3>
            <p className={`text-2xl ${
              yearSummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ${yearSummary.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr 
                key={transaction._id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-medium ${
                    transaction.type === TransactionType.CREDIT 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${transaction.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === TransactionType.CREDIT
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(transaction._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found. Click "Add Transaction" to get started.
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
