require('dotenv').config(); // Load variables at the very start
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes'); 

// --- NEW: Import Health Routes ---
const healthRoutes = require('./routes/healthRoutes'); 

const app = express();

// --- DEBUG LOGS ---
console.log("-----------------------------------------");
console.log("DEBUG: Your Firebase API Key is:", process.env.FIREBASE_API_KEY ? "LOADED" : "MISSING");
console.log("-----------------------------------------");

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Simple health check route
app.get('/', (req, res) => {
    res.send('Food Recommendation API is running...');
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Recommendation Routes
app.use('/api/recommendations', recommendationRoutes);

// --- NEW: Health Profile Routes ---
/**
 * Prefix all health routes with /api/health
 * This handles /api/health/save-profile
 */
app.use('/api/health', healthRoutes);


// --- ERROR HANDLING ---

/**
 * Catch 404 - If a user hits a route that doesn't exist
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
    console.log(`✅ Recommendation routes available at http://localhost:${PORT}/api/recommendations`);
    // --- NEW: Log for Health Routes ---
    console.log(`✅ Health routes available at http://localhost:${PORT}/api/health`);
    console.log(`-----------------------------------------`);
});