'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DiaryEntry {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const categories = ['general', 'personal', 'work', 'travel', 'health'];

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEntries();
  }, [searchTerm, selectedCategory]);

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

  const resetForms = () => {
    setShowAddForm(false);
    setEditingEntry(null);
    setNewEntry({
      title: '',
      content: '',
      category: 'general',
      tags: ''
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entryData = {
        ...newEntry,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) throw new Error('Failed to create entry');

      const savedEntry = await response.json();
      setEntries([savedEntry, ...entries]);
      resetForms();
    } catch (err) {
      setError('Failed to save diary entry');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const entryData = {
        ...editingEntry,
        tags: typeof editingEntry.tags === 'string'
          ? (editingEntry.tags as string).split(',').map(tag => tag.trim()).filter(Boolean)
          : editingEntry.tags
      };

      const response = await fetch(`/api/diary/${editingEntry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) throw new Error('Failed to update entry');

      const updatedEntry = await response.json();
      setEntries(entries.map(entry => 
        entry._id === updatedEntry._id ? updatedEntry : entry
      ));
      resetForms();
    } catch (err) {
      setError('Failed to update diary entry');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">My Diary</h1>
          {!showAddForm && !editingEntry && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add New Entry
            </button>
          )}
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

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Add New Entry</h2>
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newEntry.title}
                onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                rows={6}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({...newEntry, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newEntry.tags}
                onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., work, important, personal"
              />
            </div>

            {error && (
              <div className="text-red-600 mb-4">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Add Entry
              </button>
              <button
                type="button"
                onClick={() => resetForms()}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Entry Form */}
      {editingEntry && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Edit Entry</h2>
          <form onSubmit={handleUpdate}>
            {/* Form fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editingEntry.title}
                onChange={(e) => setEditingEntry({...editingEntry, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={editingEntry.content}
                onChange={(e) => setEditingEntry({...editingEntry, content: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                rows={6}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={editingEntry.category}
                onChange={(e) => setEditingEntry({...editingEntry, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={Array.isArray(editingEntry.tags) ? editingEntry.tags.join(', ') : ''}
                onChange={(e) => setEditingEntry({...editingEntry, tags: e.target.value.split(',').map(tag => tag.trim())})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., work, important, personal"
              />
            </div>

            {error && (
              <div className="text-red-600 mb-4">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Update Entry
              </button>
              <button
                type="button"
                onClick={() => resetForms()}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{entry.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEntry(entry)}
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
