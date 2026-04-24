require('dotenv').config(); // Load variables at the very start
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
// --- NEW: Added for Step 5 ---
const recommendationRoutes = require('./routes/recommendationRoutes'); 

// Redundant but kept as per your existing code
dotenv.config();

const app = express();

// --- DEBUG LOGS ---
console.log("-----------------------------------------");
console.log("DEBUG: Your Firebase API Key is:", process.env.FIREBASE_API_KEY ? "LOADED" : "MISSING");
console.log("-----------------------------------------");

// --- MIDDLEWARE ---
// 1. Enable CORS (allows your React frontend to communicate with this API)
app.use(cors());

// 2. Parse incoming JSON requests (important for req.body)
app.use(express.json());

// --- ROUTES ---

// Simple health check route
app.get('/', (req, res) => {
    res.send('Food Recommendation API is running...');
});

/**
 * Prefix all auth routes with /api/auth
 * This handles /api/auth/register, /api/auth/login, and /api/auth/google-login
 */
app.use('/api/auth', authRoutes);

// --- NEW: Added for Step 5 ---
/**
 * Prefix all recommendation routes with /api/recommendations
 * This handles /api/recommendations/predict
 */
app.use('/api/recommendations', recommendationRoutes);

// --- ERROR HANDLING ---

/**
 * Catch 404 - If a user hits a route that doesn't exist
 * This was sending the "Route not found" alert to your frontend
 */
app.use((req, res, next) => {
    console.warn(`404 Warning: User tried to reach ${req.originalUrl}`);
    res.status(404).json({ error: "Route not found" });
});

/**
 * Global Error Handler - Catches server crashes
 */
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.stack);
    res.status(500).json({ error: "Something went wrong on the server" });
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Auth routes available at http://localhost:${PORT}/api/auth`);
    // --- NEW: Added for Step 5 ---
    console.log(`✅ Recommendation routes available at http://localhost:${PORT}/api/recommendations`);
    console.log(`-----------------------------------------`);
});