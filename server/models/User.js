import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String }, // Derived from email (before @)
  userId: { type: String, unique: true }, // 16-digit numeric string
  googleId: { type: String, unique: true, sparse: true }, // Added for Google OAuth
  password: { type: String }, // Made optional for OAuth users
  avatar: { type: String },
  experience: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  solvedProblems: { type: Number, default: 0 }, // Unique problems attempted
  correctProblems: { type: Number, default: 0 }, // Unique problems solved correctly
  accuracy: { type: Number, default: 0 },
  userRating: { type: Number, default: 1200 }, // ELO-like rating
  totalInteractions: { type: Number, default: 0 },
  uniqueSolvedIds: [String], // To track uniqueness for correctProblems
  uniqueAttemptedIds: [String], // To track uniqueness for solvedProblems
  recentActivity: [{
    problemId: String,
    title: String,
    difficulty: String,
    status: { type: String, enum: ['Solved', 'Attempted'], default: 'Solved' }, // Derived from submissionStatus
    timestamp: { type: Date, default: Date.now },
    timeTaken: String, // e.g., "14m" or seconds
    hoursAgo: Number // Calculated dynamically or stored
  }],
  skillDistribution: [{
    name: String, // Tag name
    level: { type: Number, default: 0 } // 0.00 to 1.00
  }],
  // New Statistics Fields
  preferredCompanies: {
    type: Map,
    of: Number,
    default: {}
  },
  topicTags: {
    type: Map,
    of: {
      Easy: { type: Number, default: 0 },
      Medium: { type: Number, default: 0 },
      Hard: { type: Number, default: 0 }
    },
    default: {}
  },
  solvedCountByDifficulty: {
    Easy: { type: Number, default: 0 },
    Medium: { type: Number, default: 0 },
    Hard: { type: Number, default: 0 }
  },
  recommendationScores: {
    type: Map,
    of: Number,
    default: {}
  },
  successScores: {
    type: Map,
    of: Number,
    default: {}
  },
  isOnboarded: { type: Boolean, default: false }
});

// Ensure virtual fields are serialized
const transform = function (doc, ret) {
  ret.id = ret.userId; // Use 16-digit userId as the primary id for frontend
  delete ret._id;
  delete ret.password;
};

userSchema.set('toJSON', { virtuals: true, versionKey: false, transform });
userSchema.set('toObject', { virtuals: true, versionKey: false, transform });

const User = mongoose.model('User', userSchema);

export default User;
