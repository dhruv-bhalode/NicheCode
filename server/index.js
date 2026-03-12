import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import Interaction from './models/Interaction.js';
import axios from "axios";
import { GoogleGenerativeAI } from '@google/generative-ai'; // Added Gemini import
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieSession from 'cookie-session';
import { updateUserRecommendations } from './utils/recommendationEngine.js';
import { updateSuccessScores } from './utils/successPredictor.js';
import { calculateUserRetentionScores } from './utils/skillDecay.js';

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'your-very-secret-key';
const PORT = process.env.PORT || 5001; // Moved PORT declaration up

// --- Middleware ---
app.use(cors()); // Changed cors configuration
app.use(express.json());

// --- MongoDB Connection ---
import fs from 'fs';
const errorLog = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('global_errors.txt', `[${timestamp}] ${msg}\n`);
};

process.on('uncaughtException', (err) => {
  errorLog(`Uncaught Exception: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  errorLog(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected')) // Updated success message
  .catch(err => {
    console.error('MongoDB connection error:', err);
    errorLog(`MongoDB connection error: ${err.message}`);
  });

// --- Gemini Setup --- // Added Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

import session from 'express-session';
import MongoStore from 'connect-mongo';

// --- Auth Middleware ---
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Passport Config ---
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ["profile", "email"]
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists by email (link accounts)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos[0].value;
            await user.save();
          } else {
            // Create new user
            // Generate 16-digit userId
            let userId;
            let isUnique = false;
            while (!isUnique) {
              userId = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
              const existingId = await User.findOne({ userId });
              if (!existingId) isUnique = true;
            }

            user = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              username: profile.emails[0].value.split('@')[0],
              avatar: profile.photos[0].value,
              userId: userId,
              recentActivity: [],
              skillDistribution: [
                { name: 'Arrays', level: 0 },
                { name: 'Strings', level: 0 },
                { name: 'DP', level: 0 },
                { name: 'Trees', level: 0 }
              ],
              solvedProblems: 0,
              correctProblems: 0,
              accuracy: 0,
              userRating: 1200,
              experience: 'Beginner',
              isOnboarded: false
            });
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  ));

  // --- API Routes ---
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET_KEY, { expiresIn: '1h' });

      // Redirect to frontend with token
      // Assuming frontend is running on port 5173 (Vite default)
      // In production, this should be an env variable
      res.redirect(`http://localhost:5173/auth/success?token=${token}`);
    }
  );
} else {
  console.warn("Google OAuth credentials missing. /api/auth/google route disabled.");
  app.get('/api/auth/google', (req, res) => {
    res.status(500).send("Google OAuth is not configured on the server. Please check .env file.");
  });
}
app.post('/api/ai/hint', async (req, res) => {
  try {
    const { problemTitle, problemDescription, currentCode } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Restored to 2.5 Flash as requested

    const prompt = `
        You are an expert coding tutor. The user is solving the problem: "${problemTitle}".
        Description: ${problemDescription}
        
        Current Code:
        ${currentCode || "No code written yet."}

        Provide a single, short, helpful hint to guide them towards the optimal solution without giving away the answer directly. Focus on the logic or data structure.
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ hint: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate hint" });
  }
});
// ... (previous hint endpoint)

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { query, history } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(query);
    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// --- Problem Schema ---
const problemSchema = new mongoose.Schema({
  title: String,
  slug: String,
  difficulty: String,
  frequency: Number,
  acceptanceRate: Number,
  topics: [String],
  companies: [String]
});

import Problem from './models/Problem.js';

// --- API Routes ---
// --- Middleware to verify token ---
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided.' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).json({ message: 'Failed to authenticate token.' });
    req.userId = decoded.id;
    next();
  });
};

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 16-digit userId
    let userId;
    let isUnique = false;
    while (!isUnique) {
      userId = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
      const existingId = await User.findOne({ userId });
      if (!existingId) isUnique = true;
    }

    const username = email.split('@')[0];

    const newUser = new User({
      name,
      email,
      username,
      userId,
      password: hashedPassword,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      recentActivity: [],
      skillDistribution: [
        { name: 'Arrays', level: 0 },
        { name: 'Strings', level: 0 },
        { name: 'DP', level: 0 },
        { name: 'Trees', level: 0 }
      ],
      isOnboarded: false
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, SECRET_KEY, { expiresIn: '1h' });

    // Return user without password and with id
    const userResponse = newUser.toObject();
    userResponse.id = userResponse.userId;
    delete userResponse._id;
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: 'Server error during sign up.' });
  }

});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Ensure user has userId (migration for old users)
    if (!user.userId) {
      let userId;
      let isUnique = false;
      while (!isUnique) {
        userId = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
        const existingId = await User.findOne({ userId });
        if (!existingId) isUnique = true;
      }
      user.userId = userId;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    // Return user without password and with id
    const userResponse = user.toObject();
    userResponse.id = userResponse.userId;
    delete userResponse._id;
    delete userResponse.password;

    res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

app.post('/api/interactions', async (req, res) => {
  try {
    console.log("Interaction Request Body:", req.body); // DEBUG
    const { userId, username, problemId, title, language, submissionStatus, timeTakenSeconds, runtimeMs, memoryUsedKB } = req.body;

    if (!userId || !problemId || !title || !username) {
      console.error("Missing required fields:", { userId, username, problemId, title }); // DEBUG
      return res.status(400).json({ message: "Missing required fields." });
    }

    // --- Advanced User Stats Update ---
    let user = await User.findOne({ userId });
    if (!user && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    const problem = await Problem.findOne({ id: problemId }); // Need problem for difficulty/tags

    if (user && problem) {
      // 1. Update Recent Activity (Last 7 days)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Filter out old activity
      user.recentActivity = user.recentActivity.filter(activity => new Date(activity.timestamp) > oneWeekAgo);

      // Add new activity
      user.recentActivity.push({
        problemId,
        title,
        difficulty: problem.difficulty,
        status: submissionStatus === 1 ? 'Solved' : 'Attempted',
        timestamp: now,
        timeTaken: `${timeTakenSeconds}s`,
        hoursAgo: 0 // This will be calculated on retrieval usually, but we can store 0 for now
      });

      // 2. Update Counts
      user.totalInteractions = (user.totalInteractions || 0) + 1;

      // Ensure unique arrays exist
      if (!user.uniqueAttemptedIds) user.uniqueAttemptedIds = [];
      if (!user.uniqueSolvedIds) user.uniqueSolvedIds = [];

      // Update Solved Problems (Unique Attempted)
      if (!user.uniqueAttemptedIds.includes(problemId)) {
        user.uniqueAttemptedIds.push(problemId);
        user.solvedProblems = user.uniqueAttemptedIds.length;
      }

      // Update Correct Problems (Unique Solved)
      if (submissionStatus === 1 && !user.uniqueSolvedIds.includes(problemId)) {
        user.uniqueSolvedIds.push(problemId);
        user.correctProblems = user.uniqueSolvedIds.length;
      }

      // 3. Update Accuracy
      if (user.totalInteractions > 0) {
        user.accuracy = user.correctProblems / user.totalInteractions;
      }

      // 4. Update Skill Vector
      const difficultyFactor = problem.difficulty === 'Easy' ? 0.3 : (problem.difficulty === 'Medium' ? 0.7 : 1.0);

      if (problem.tags && problem.tags.length > 0) {
        problem.tags.forEach(tag => {
          let skill = user.skillDistribution.find(s => s.name === tag);
          if (!skill) {
            skill = { name: tag, level: 0 };
            user.skillDistribution.push(skill);
          }
          // Enhanced Skill Update:
          // If Solved: Weighted average (20% new) but PREVENT REGRESSION
          // If Failed: Weighted average (5% new)

          if (submissionStatus === 1) {
            const newLevel = (skill.level * 0.80) + (difficultyFactor * 0.20);
            skill.level = Math.max(skill.level, newLevel);
            if (skill.level < difficultyFactor) {
              skill.level += 0.05; // Bonus
            }
          } else {
            skill.level = (skill.level * 0.95) + (difficultyFactor * 0.05);
          }

          // Cap at 1.00
          if (skill.level > 1.0) skill.level = 1.0;
        });
      }

      // 5. Update User Rating (ELO)
      // Scaling: Easy(3/10), Medium(7/6), Hard(10/3)
      let ratingChange = 0;
      if (submissionStatus === 1) {
        // Increment: Easy: 3, Medium: 7, Hard: 10
        ratingChange = problem.difficulty === 'Easy' ? 3 : (problem.difficulty === 'Medium' ? 7 : 10);
      } else {
        // Decrement: Easy: 10, Medium: 6, Hard: 3
        ratingChange = problem.difficulty === 'Easy' ? -10 : (problem.difficulty === 'Medium' ? -6 : -3);
      }
      user.userRating = (user.userRating || 1200) + ratingChange;

      // Clamp rating between 0 and 3000
      user.userRating = Math.max(0, Math.min(3000, user.userRating));

      // 6. Update Preferred Companies (All Attempts)
      if (problem.companies && problem.companies.length > 0) {
        if (!user.preferredCompanies) user.preferredCompanies = new Map();
        problem.companies.forEach(company => {
          const safeKey = company.replace(/\./g, '_');
          const currentCount = user.preferredCompanies.get(safeKey) || 0;
          user.preferredCompanies.set(safeKey, currentCount + 1);
        });
      }

      // 7. Update Topic Tags & Solved Counts (Only Correct Solutions)
      if (submissionStatus === 1) {
        // Initialize if missing
        if (!user.solvedCountByDifficulty) {
          user.solvedCountByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
        }

        // Update Solved Count by Difficulty
        if (problem.difficulty && ['Easy', 'Medium', 'Hard'].includes(problem.difficulty)) {
          user.solvedCountByDifficulty[problem.difficulty] = (user.solvedCountByDifficulty[problem.difficulty] || 0) + 1;
        }

        // Update Topic Tags Mastery
        if (problem.tags && problem.tags.length > 0) {
          if (!user.topicTags) user.topicTags = new Map();

          problem.tags.forEach(tag => {
            const safeTag = tag.replace(/\./g, '_');
            let topicStats = user.topicTags.get(safeTag);
            if (!topicStats) {
              topicStats = { Easy: 0, Medium: 0, Hard: 0 };
            }

            if (problem.difficulty && ['Easy', 'Medium', 'Hard'].includes(problem.difficulty)) {
              topicStats[problem.difficulty] = (topicStats[problem.difficulty] || 0) + 1;
            }

            user.topicTags.set(safeTag, topicStats);
          });
        }
      }

      // 6. Update Experience
      if (user.correctProblems < 100) {
        user.experience = 'Beginner';
      } else if (user.correctProblems <= 600) {
        user.experience = 'Intermediate';
      } else {
        user.experience = 'Advanced';
      }

      // 8. Update Recommendation Scores (Direct Ebbinghaus Forgetting Curve Logic)
      const retentionScores = await calculateUserRetentionScores(userId);
      if (retentionScores && Object.keys(retentionScores).length > 0) {
        if (!user.recommendationScores) user.recommendationScores = new Map();
        for (const [pid, retention] of Object.entries(retentionScores)) {
          // Store retention as a negative recommendation score to prioritize solved problems for review
          user.recommendationScores.set(pid, parseFloat(retention.toFixed(4)));
        }
      }

      await user.save();
    }

    const newInteraction = new Interaction({
      userId,
      username,
      problemId,
      title,
      language,
      submissionStatus, // 1 or 0
      timeTakenSeconds,
      runtimeMs,
      memoryUsedKB,
      companies: problem ? problem.companies : [],
      difficulty: problem ? problem.difficulty : undefined,
      tags: problem ? problem.tags : []
    });

    await newInteraction.save();

    // Trigger Recommendation Update (Await to ensure dashboard is fresh)
    try {
      await updateUserRecommendations(userId);
      // Trigger Success Score Update
      await updateSuccessScores(userId);
    } catch (recErr) {
      console.error("Rec/Success update failed:", recErr);
    }

    res.status(201).json({
      message: "Interaction recorded successfully.",
      user: user.toObject()
    });
  } catch (error) {
    console.error("Interaction Error:", error);
    res.status(500).json({ message: "Failed to record interaction." });
  }
});

// Get Problem Metadata for Onboarding (Companies & Tags)
app.get('/api/problems/metadata', async (req, res) => {
  try {
    const companies = await Problem.distinct('companies');
    const tags = await Problem.distinct('tags');

    // Filter out null/empty strings just in case
    const safeCompanies = companies.filter(c => c).sort();
    const safeTags = tags.filter(t => t).sort();

    res.json({
      companies: safeCompanies,
      tags: safeTags
    });
  } catch (error) {
    console.error("Metadata Error:", error);
    res.status(500).json({ message: "Failed to fetch metadata." });
  }
});

// Onboard New User
app.post('/api/users/onboard', async (req, res) => {
  try {
    const { userId, preferredCompany, preferredCompanies, experience, topics } = req.body;

    if (!userId) return res.status(400).json({ message: "UserId required" });

    let user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Set Preferred Companies
    if (!user.preferredCompanies) user.preferredCompanies = new Map();

    if (preferredCompanies && Array.isArray(preferredCompanies)) {
      preferredCompanies.forEach(company => {
        if (typeof company === 'string') {
          const safeKey = company.replace(/\./g, '_');
          user.preferredCompanies.set(safeKey, 3);
        }
      });
    } else if (preferredCompany) {
      const safeKey = preferredCompany.replace(/\./g, '_');
      user.preferredCompanies.set(safeKey, 3);
    }

    // 2. Set Experience
    if (experience && ['Beginner', 'Intermediate', 'Advanced'].includes(experience)) {
      user.experience = experience;
    }

    // 3. Set Skill Distribution (Topics)
    if (topics && Array.isArray(topics) && topics.length > 0) {
      // Calculate factor
      const expMap = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      const factor = expMap[experience] || 1; // Default to Beginner if invalid/missing
      const score = 0.05 * factor;

      topics.forEach(tag => {
        // Find existing or create (likely create for new user)
        let skillIndex = user.skillDistribution.findIndex(s => s.name === tag);
        if (skillIndex === -1) {
          user.skillDistribution.push({ name: tag, level: 0 });
          skillIndex = user.skillDistribution.length - 1;
        }
        // Add score (clamped to 1.0 ideally, but init is small)
        const currentLevel = user.skillDistribution[skillIndex].level;
        user.skillDistribution[skillIndex].level = Math.min(1.0, currentLevel + score);
      });
    }

    user.isOnboarded = true;
    await user.save();
    res.json({ message: "User onboarded successfully", user });

  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ message: "Failed to onboard user." });
  }
});

// Get User Stats for Dashboard
app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user
    let user = await User.findOne({ userId });
    if (!user && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch all interactions for this user
    const interactions = await Interaction.find({ userId }).sort({ createdAt: -1 });

    // Calculate Average Time (total time / solvedProblems)
    const totalTimeSeconds = interactions.reduce((sum, i) => sum + (i.timeTakenSeconds || 0), 0);
    const avgTimeSeconds = user.solvedProblems > 0 ? Math.round(totalTimeSeconds / user.solvedProblems) : 0;

    // Format avg time as "Xm Ys"
    const avgTimeMinutes = Math.floor(avgTimeSeconds / 60);
    const avgTimeSecondsRemainder = avgTimeSeconds % 60;
    const avgTimeFormatted = `${avgTimeMinutes}m ${avgTimeSecondsRemainder}s`;

    // Calculate Streak from recentActivity (consecutive days with activity)
    let currentStreak = 0;
    if (user.recentActivity && user.recentActivity.length > 0) {
      const sortedActivity = [...user.recentActivity].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);
      const activityDates = new Set(
        sortedActivity.map(a => {
          const d = new Date(a.timestamp);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      // Check if there's activity today or yesterday (to allow for streak continuation)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (activityDates.has(today.getTime()) || activityDates.has(yesterday.getTime())) {
        // Start from yesterday if no activity today
        if (!activityDates.has(today.getTime())) {
          checkDate = new Date(yesterday);
        }

        while (activityDates.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    // Get top 10 skills from skillDistribution
    const top10Skills = (user.skillDistribution || [])
      .sort((a, b) => b.level - a.level)
      .slice(0, 10)
      .map(skill => ({
        name: skill.name,
        level: Math.round(skill.level * 100) // Convert 0-1 to 0-100
      }));

    // Get last 5 activities with time ago and status
    const last5Activities = (user.recentActivity || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(activity => {
        const now = new Date();
        const activityTime = new Date(activity.timestamp);
        const hoursAgo = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));

        let timeAgo;
        if (hoursAgo < 1) {
          const minutesAgo = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
          timeAgo = `${minutesAgo}m ago`;
        } else if (hoursAgo < 24) {
          timeAgo = `${hoursAgo}h ago`;
        } else {
          const daysAgo = Math.floor(hoursAgo / 24);
          timeAgo = `${daysAgo}d ago`;
        }

        return {
          problemId: activity.problemId,
          title: activity.title,
          difficulty: activity.difficulty,
          status: activity.status, // 'Solved' or 'Attempted'
          timestamp: activity.timestamp,
          timeTaken: activity.timeTaken,
          timeAgo
        };
      });

    res.json({
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        experience: user.experience,
        solvedProblems: user.solvedProblems,
        correctProblems: user.correctProblems,
        accuracy: Math.round(user.accuracy * 100), // Convert to percentage
        userRating: user.userRating,
        totalInteractions: user.totalInteractions,
        preferredCompanies: user.preferredCompanies ? Object.fromEntries(user.preferredCompanies) : {},
        successScores: user.successScores ? Object.fromEntries(user.successScores) : {},

      },
      stats: {
        avgTime: avgTimeFormatted,
        avgTimeSeconds,
        streak: currentStreak,
        top10Skills,
        last5Activities
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Revisions (Top 5 forgotten solved problems)
app.get('/api/users/:userId/revisions', async (req, res) => {
  try {
    const { userId } = req.params;

    // Force update recommendations to calculate fresh retention scores (decay over time)
    await updateUserRecommendations(userId);

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get recommendation scores
    const scores = user.recommendationScores ? Object.fromEntries(user.recommendationScores) : {};
    const solvedIds = user.uniqueSolvedIds || [];

    // Filter solved problems with negative scores
    let revisions = solvedIds
      .filter(id => scores[id] !== undefined && scores[id] < 0)
      .map(id => ({
        id,
        score: scores[id],
        retention: Math.abs(scores[id])
      }));

    // Sort by Score DESCENDING (Closer to 0 is better/worse retention?)
    // Requirement: "Top 5 recommendations... score incremented from -1 until 0"
    // Meaning closer to 0 = Needs revision MORE?
    // Wait, "recommendation scores will always go towards 0".
    // Usually higher recommendation score = better recommendation.
    // -0.1 > -0.9.
    // So yes, sort DESCENDING (-0.1 is top, -0.9 is bottom).
    // -0.1 means Retention 0.1 (10%). Forgot almost everything.
    // -0.9 means Retention 0.9 (90%). Remembered well.
    // So we want closer to 0.

    revisions.sort((a, b) => b.score - a.score);

    // Take top 5
    const top5Revisions = revisions.slice(0, 5);

    // Hydrate with Problem Details
    const problemIds = top5Revisions.map(r => r.id);
    const problems = await Problem.find({ id: { $in: problemIds } });
    const problemMap = new Map(problems.map(p => [p.id, p]));

    const detailedRevisions = top5Revisions.map(r => {
      const p = problemMap.get(r.id);
      return {
        id: r.id,
        title: p ? p.title : `Problem ${r.id}`,
        difficulty: p ? p.difficulty : 'Medium',
        tags: p ? p.tags : [],
        retention: r.retention,
        score: r.score
      };
    });

    res.json(detailedRevisions);

  } catch (error) {
    console.error("Error fetching revisions:", error);
    res.status(500).json({ message: "Failed to fetch revisions" });
  }
});

app.get("/api/leetcode/:slug", async (req, res) => {
  // Deprecated: Fetching from LeetCode directly. 
  // Kept for fallback if needed, but we should use our own DB now.
  try {
    const { slug } = req.params;
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              title
              content
              difficulty
              exampleTestcases
              codeSnippets {
                lang
                langSlug
                code
              }
            }
          }
        `,
        variables: { titleSlug: slug }
      },
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    res.json(response.data.data.question);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});


app.get("/api/companies", async (req, res) => {
  try {
    const companies = await Problem.distinct("companies");
    // Filter out empty or null values and sort alphabetically
    const cleanCompanies = companies.filter(c => c).sort();
    res.json(cleanCompanies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/problems", async (req, res) => {
  try {
    const { company, difficulty, topic, search, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (company) filter.companies = { $in: [company] };
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.tags = { $in: [topic] }; // Note: Schema uses 'tags', not 'topics'
    if (search) {
      // Check if search is a number (problem ID)
      const isNumber = /^\d+$/.test(search);
      if (isNumber) {
        // Search by exact ID or IDs that start with the number
        filter.$or = [
          { id: search },
          { id: { $regex: `^${search}`, $options: 'i' } }
        ];
      } else {
        filter.title = { $regex: search, $options: 'i' };
      }
    }

    // Return lightweight objects for list view
    const problems = await Problem.find(filter)
      .select('id title difficulty acceptanceRate percentage tags companies') // Select only needed fields
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Problem.countDocuments(filter);

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/problems/:id", async (req, res) => {
  try {
    const problem = await Problem.findOne({ id: req.params.id });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:userId/recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /recommendations for ${userId}`);
    const user = await User.findOne({ userId });

    if (!user) {
      console.log("User not found via ID");
      return res.status(404).json({ message: "User not found" });
    }

    // If no scores, triggger calc
    // Check if recommendationScores is missing or has 0 keys
    const scoreSize = user.recommendationScores ? user.recommendationScores.size : 0;
    console.log(`Scores present? ${!!user.recommendationScores}. Size: ${scoreSize}`);

    if (!user.recommendationScores || scoreSize === 0) {
      console.log("Triggering recommendation update...");
      await updateUserRecommendations(userId);
      const updatedUser = await User.findOne({ userId }); // re-fetch
      if (updatedUser) {
        user.recommendationScores = updatedUser.recommendationScores;
        console.log(`Update done. New size: ${user.recommendationScores ? user.recommendationScores.size : 0}`);
      }
    }

    // Also trigger Success Scores if missing
    if (!user.successScores || user.successScores.size === 0) {
      console.log("Triggering Success Scores update...");
      await updateSuccessScores(userId);
      const updatedUserAfterSuccess = await User.findOne({ userId });
      if (updatedUserAfterSuccess) {
        user.successScores = updatedUserAfterSuccess.successScores;
      }
    }

    if (!user.recommendationScores) return res.json([]);

    const top5Ids = Array.from(user.recommendationScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    if (top5Ids.length === 0) return res.json([]);

    const problems = await Problem.find({ id: { $in: top5Ids } });

    // Map back to maintain sort order
    const recommendations = top5Ids.map(id => {
      const p = problems.find(prob => prob.id === id);
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        companies: p.companies,
        score: user.recommendationScores.get(id),
        successScore: user.successScores && user.successScores.get(id) !== undefined ? Number(user.successScores.get(id)) : null
      };
    }).filter(p => p);

    res.json(recommendations);
  } catch (err) {
    console.error("Rec Error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
