import mongoose from 'mongoose';

const AudioStreamSchema = new mongoose.Schema({
  language: String,
  codec: String,
  channels: Number,
});

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleWithYear: String,
  uniqueTitle: String,
  year: Number,
  duration: Number, // in minutes
  fileSize: Number, // in bytes
  resolution: String,
  dimensions: String,
  videoCodec: String,
  audioStreams: [AudioStreamSchema],
  lastUpdated: { type: Date, default: Date.now },
  plexId: { type: String, required: true, unique: true },
});

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema); 