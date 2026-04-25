const { auth, db } = require('../config/firebase'); 
const axios = require('axios');
require('dotenv').config();

// --- REGISTER ---
const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // 1. Better Validation
        if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
        
        // 2. FIRESTORE FIX: Ensure username is NEVER undefined
        const finalUsername = username || email.split('@')[0] || "New User";

        // 3. Create user in Firebase AUTH
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: finalUsername,
        });

        // 4. Save to Firestore (Fail-safe)
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            username: finalUsername,
            email: email,
            createdAt: new Date().toISOString(),
            role: "user",
            authMethod: "email"
        });

        res.status(201).json({ message: "Account created successfully!" });
    } catch (error) {
        console.error("Register Error:", error.code);
        // Better error handling for UI
        let message = "Registration failed";
        if (error.code === 'auth/email-already-exists') message = "This email is already registered.";
        if (error.code === 'auth/invalid-password') message = "Password must be at least 6 characters.";
        
        res.status(400).json({ error: message });
    }
};

// --- LOGIN ---
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const API_KEY = process.env.FIREBASE_API_KEY;

        if (!API_KEY) return res.status(500).json({ error: "Server Configuration Error: API Key missing" });

        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const response = await axios.post(signInUrl, { email, password, returnSecureToken: true });

        res.json({ 
            message: "Success", 
            token: response.data.idToken, 
            user: { 
                username: response.data.displayName || "User", 
                email: response.data.email, 
                uid: response.data.localId 
            } 
        });
    } catch (error) {
        const firebaseError = error.response?.data?.error?.message;
        let message = "Login failed";
        if (firebaseError === 'EMAIL_NOT_FOUND' || firebaseError === 'INVALID_PASSWORD') {
            message = "Invalid email or password.";
        }
        res.status(401).json({ error: message });
    }
};

// --- GOOGLE LOGIN ---
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "No Google token provided" });

        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        let userData;

        if (!userDoc.exists) {
            // Ensure values are never undefined for Firestore
            userData = {
                uid: uid,
                username: name || email.split('@')[0] || "Google User",
                email: email,
                profilePic: picture || "",
                createdAt: new Date().toISOString(),
                role: "user",
                authMethod: "google"
            };
            await userRef.set(userData);
        } else {
            userData = userDoc.data();
        }

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
        res.status(401).json({ error: "Google Auth Failed" });
    }
};

module.exports = { register, login, googleLogin };