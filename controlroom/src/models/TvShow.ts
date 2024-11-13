import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema({
  title: String,
  seasonNumber: Number,
  episodeNumber: Number,
  duration: Number,
  fileSize: Number,
  resolution: String,
  videoCodec: String,
  plexId: String,
});

const SeasonSchema = new mongoose.Schema({
  seasonNumber: Number,
  episodeCount: Number,
  episodes: [EpisodeSchema],
  plexId: String,
});

const TvShowSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: false },
  seasonCount: { type: Number, required: false, default: 0 },
  episodeCount: { type: Number, required: false, default: 0 },
  totalDuration: { type: Number, required: false, default: 0 }, // in minutes
  totalFileSize: { type: Number, required: false, default: 0 }, // in bytes
  seasons: { type: [SeasonSchema], required: false, default: [] },
  lastUpdated: { type: Date, default: Date.now },
  plexId: { type: String, required: true, unique: true },
});

// Add a pre-save middleware to ensure required fields
TvShowSchema.pre('save', function(next) {
  console.log('Pre-save middleware running for show:', this.title);
  next();
});

const TvShow = mongoose.models.TvShow || mongoose.model('TvShow', TvShowSchema);

export default TvShow; 