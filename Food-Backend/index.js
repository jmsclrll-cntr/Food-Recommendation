require('dotenv').config(); // Load variables at the very start
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // ADDED: Required for database connection
const authRoutes = require('./routes/authRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes'); 
const healthRoutes = require('./routes/healthRoutes'); 
const dietRoutes = require('./routes/dietRoutes'); 
const { syncMLData } = require('./ml/mlDataService');
const { startEmailScheduler } = require('./cron/emailScheduler');


// --- FIREBASE INITIALIZATION (THIS WAS THE MISSING PART) ---
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

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

/**
 * Prefix all routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/diets', dietRoutes);


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

// 1. I-define muna ang PORT bago gamitin
const PORT = process.env.PORT || 5000;

// 2. ISANG app.listen lang dapat ang gamitin
app.listen(PORT, async () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
    // Tawagin ang syncMLData para ma-load ang health_logs sa memory
    try {
        await syncMLData(); 
        console.log(`✅ ML Knowledge Base is ready.`);
        
        // Start the email notification scheduler
        startEmailScheduler();
        console.log(`✅ Email Notification Scheduler is active.`);
        
        // Run database inspection preview on startup
        const { inspect } = require('./scripts/inspect_db');
        await inspect();
    } catch (error) {
        console.error("❌ ML Sync Failed:", error);
    }

    console.log(`✅ Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`✅ Recommendation routes: http://localhost:${PORT}/api/recommendations`);
    console.log(`✅ Health routes: http://localhost:${PORT}/api/health`);
    console.log(`✅ Diet routes: http://localhost:${PORT}/api/diets`);
    console.log(`-----------------------------------------`);
});