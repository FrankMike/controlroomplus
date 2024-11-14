import { useEffect } from 'react';
import { ITransaction, TransactionType, RecurrenceInterval } from '@/types/transaction';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingTransaction: ITransaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction
}: TransactionModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: formData.get('amount'),
      description: formData.get('description'),
      type: formData.get('type'),
      date: formData.get('date'),
      isRecurring: false,
      recurrenceInterval: RecurrenceInterval.NONE,
    };
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 pl-1">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 pl-1">
                  Amount
                </label>
                <div className="mt-1.5 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    step="0.01"
                    defaultValue={editingTransaction?.amount || ''}
                    className="block w-full rounded-lg border-0 py-3 pl-8 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 pl-1">
                  Description
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    name="description"
                    id="description"
                    defaultValue={editingTransaction?.description || ''}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter description"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 pl-1">
                  Type
                </label>
                <div className="mt-1.5">
                  <select
                    name="type"
                    id="type"
                    defaultValue={editingTransaction?.type || TransactionType.DEBIT}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                  >
                    <option value={TransactionType.DEBIT}>Debit (Expense)</option>
                    <option value={TransactionType.CREDIT}>Credit (Income)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 pl-1">
                  Date
                </label>
                <div className="mt-1.5">
                  <input
                    type="date"
                    name="date"
                    id="date"
                    defaultValue={editingTransaction 
                      ? new Date(editingTransaction.date).toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]
                    }
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingTransaction ? 'Save Changes' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 