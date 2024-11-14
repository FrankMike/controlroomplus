import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  sessionDate: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema); 