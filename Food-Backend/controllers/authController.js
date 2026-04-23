const { auth, db } = require('../config/firebase'); 
const axios = require('axios');
require('dotenv').config();

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// --- REGISTER (Email/Password) ---
const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        // Create user in Firebase AUTH
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: username,
        });

        // Save user data to FIRESTORE
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            username: username,
            email: email,
            createdAt: new Date().toISOString(),
            role: "user",
            authMethod: "email"
        });

        res.status(201).json({ 
            message: "User created and saved to database!", 
            uid: userRecord.uid 
        });
    } catch (error) {
        console.error("Register Error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// --- LOGIN (Email/Password) ---
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

        if (!FIREBASE_API_KEY) {
            return res.status(500).json({ error: "Backend cannot read .env file. Check folder structure." });
        }

        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
        const response = await axios.post(signInUrl, { email, password, returnSecureToken: true });

        res.json({ 
            message: "Success", 
            token: response.data.idToken, 
            user: { 
                username: response.data.displayName, 
                email: response.data.email, 
                uid: response.data.localId 
            } 
        });
    } catch (error) {
        console.error("Firebase Error Body:", error.response?.data);
        res.status(401).json({ error: error.response?.data?.error?.message || "Login failed" });
    }
};

// --- GOOGLE LOGIN (Social Auth) ---
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body; // Received from frontend
        
        if (!idToken) {
            return res.status(400).json({ error: "No Google token provided" });
        }

        // 1. Verify the Google Token using Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // 2. Check if user already exists in Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        let userData;

        if (!userDoc.exists) {
            // 3. If user is new, create the document in Firestore
            userData = {
                uid: uid,
                username: name || email.split('@')[0],
                email: email,
                profilePic: picture || "",
                createdAt: new Date().toISOString(),
                role: "user",
                authMethod: "google"
            };
            await userRef.set(userData);
            console.log("New Google user registered in Firestore:", uid);
        } else {
            // 4. If user exists, fetch existing data from Firestore
            userData = userDoc.data();
            console.log("Existing Google user logged in:", uid);
        }

        // 5. Send back success response
        res.json({ 
            message: "Success",
            token: idToken, 
            user: { 
                username: userData.username, 
                email: userData.email, 
                uid: userData.uid,
                profilePic: userData.profilePic 
            } 
        });

    } catch (error) {
        console.error("Google Login Error:", error.message);
        res.status(401).json({ error: "Invalid Google Token or Database error" });
    }
};

// EXPORT ALL FUNCTIONS
// Ensure these names match exactly with your routes/authRoutes.js
module.exports = {
    register,
    login,
    googleLogin
};