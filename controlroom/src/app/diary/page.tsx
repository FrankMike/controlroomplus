'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DiaryModal from '@/components/DiaryModal';
import { DiaryEntry } from '@/types/Diary';
import { useSession } from 'next-auth/react';

const categories = ['general', 'personal', 'work', 'travel', 'health'];

export default function DiaryPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEntries();
    }
  }, [searchTerm, selectedCategory, status]);

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/diary?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError('Failed to load diary entries');
    }
  };

  const handleSave = async (entry: Partial<DiaryEntry>) => {
    try {
      const isEditing = !!entry._id;
      const response = await fetch(
        isEditing ? `/api/diary/${entry._id}` : '/api/diary',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }
      );

      if (!response.ok) throw new Error('Failed to save entry');

      const savedEntry = await response.json();
      
      if (isEditing) {
        setEntries(entries.map(e => e._id === savedEntry._id ? savedEntry : e));
      } else {
        setEntries([savedEntry, ...entries]);
      }
      
      setError('');
    } catch (err) {
      setError('Failed to save diary entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/diary/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete entry');

      setEntries(entries.filter(entry => entry._id !== id));
    } catch (err) {
      setError('Failed to delete diary entry');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">My Diary</h1>
          <button
            onClick={() => {
              setSelectedEntry(undefined);
              setIsModalOpen(true);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add New Entry
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md flex-1"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      <DiaryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(undefined);
        }}
        onSave={handleSave}
        entry={selectedEntry}
      />

      {/* Entries List */}
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{entry.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{entry.content}</p>
            <div className="flex gap-2 mb-2">
              <span className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                {entry.category}
              </span>
              {entry.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 rounded-md text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Created: {new Date(entry.createdAt).toLocaleDateString()}
              {entry.updatedAt && new Date(entry.updatedAt).getTime() > new Date(entry.createdAt).getTime() + 1000 && 
                ` (Updated: ${new Date(entry.updatedAt).toLocaleDateString()})`
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
