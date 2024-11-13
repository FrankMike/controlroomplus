'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Note } from '@/types/Note';
import NoteModal from '@/components/NoteModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NotesPage() {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const { user } = useAuth();
  const router = useRouter();

  const checkAndFetchNotes = useCallback(async () => {
    setIsLoading(true);
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    try {
      const response = await fetch('/api/notes', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch notes:', errorData);
        throw new Error(errorData.error || 'Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data);
      // Expand the most recent note if it exists
      if (data.length > 0) {
        setExpandedNoteId(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      setError('Failed to load notes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('Notes page mounted, current user:', user);
    checkAndFetchNotes();
  }, [user, checkAndFetchNotes]);

  const handleSave = async (note: Partial<Note>) => {
    try {
      const isEditing = !!note?._id;
      console.log('Saving note:', note);
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/notes', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...note,
          sessionDate: new Date(note.sessionDate as Date),
        }),
      });
      
      const responseData = await response.json();
      // console.log('Server response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save note');
      }
      
      // console.log('Note saved successfully:', responseData);
      
      await checkAndFetchNotes();
      setIsModalOpen(false);
      setEditingNote(undefined);
    } catch (error) {
      console.error('Failed to save note:', error);
      setError(error instanceof Error ? error.message : 'Failed to save note');
      
      // If unauthorized, redirect to login
      if (error instanceof Error && error.message === 'Not authenticated') {
        router.push('/login');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      await checkAndFetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const toggleNote = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Therapy Session Notes</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            setEditingNote(undefined);
            setIsModalOpen(true);
          }}
        >
          Add New Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notes.map((note) => (
              <React.Fragment key={note._id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer group"
                  onClick={() => toggleNote(note._id)}
                >
                  <td className="px-6 py-4 w-8">
                    <svg
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        expandedNoteId === note._id ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center">
                    <span>{format(new Date(note.sessionDate), 'MMMM d, yyyy')}</span>
                    <span className="ml-2 text-sm text-gray-500 group-hover:text-gray-700">
                      (Click to {expandedNoteId === note._id ? 'hide' : 'show'} notes)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-blue-600 hover:text-blue-800 mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note);
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note._id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedNoteId === note._id && (
                  <tr key={`${note._id}-content`}>
                    <td className="px-6 py-4 bg-gray-50" colSpan={3}>
                      <div className="whitespace-pre-wrap">{note.content}</div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(undefined);
        }}
        onSave={handleSave}
        note={editingNote}
      />
    </div>
  );
}
