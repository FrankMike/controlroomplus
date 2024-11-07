import { useState, useEffect } from 'react';
import { Note } from '@/types/Note';
import { format, parseISO } from 'date-fns';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  note?: Note;
}

export default function NoteModal({ isOpen, onClose, onSave, note }: NoteModalProps) {
  const [sessionDate, setSessionDate] = useState(
    note ? format(parseISO(note.sessionDate.toString()), 'yyyy-MM-dd') : ''
  );
  const [content, setContent] = useState(note?.content || '');

  useEffect(() => {
    if (note) {
      setSessionDate(format(parseISO(note.sessionDate.toString()), 'yyyy-MM-dd'));
      setContent(note.content);
    } else {
      setSessionDate('');
      setContent('');
    }
  }, [note]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {note ? 'Edit Note' : 'New Note'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!sessionDate || !content) {
                  alert('Please fill in all required fields');
                  return;
                }

                onSave({
                  _id: note?._id,
                  sessionDate: new Date(sessionDate),
                  content,
                });
                onClose();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 