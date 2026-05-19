const { auth, db } = require('../config/firebase'); 
const axios = require('axios');
require('dotenv').config();

// --- REGISTER ---
const register = async (req, res) => {
    try {
        const { email, password, username, name, profilePic } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
        
        const finalUsername = username || name || email.split('@')[0] || "New User";

        // Create user in Firebase AUTH
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: finalUsername,
        });

        // Save to Firestore with all biometric fields
        const userData = {
            uid: userRecord.uid,
            username: finalUsername,
            email: email,
            profilePic: profilePic || "", // SAVE THE CARTOON PIC HERE
            weight: 0,
            height: 0,
            bio: "",
            createdAt: new Date().toISOString(),
            role: "user",
            authMethod: "email"
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        res.status(201).json({ 
            message: "Account created successfully!",
            user: userData
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(400).json({ error: error.message });
    }
};

// --- LOGIN ---
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const API_KEY = process.env.FIREBASE_API_KEY;

        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const response = await axios.post(signInUrl, { email, password, returnSecureToken: true });

        const uid = response.data.localId;

        // CRITICAL FIX: Fetch full user data from Firestore during login
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : { username: response.data.displayName, email: response.data.email, uid };

        res.json({ 
            message: "Success", 
            token: response.data.idToken, 
            user: userData // Send the full Firestore object (including profilePic)
        });
    } catch (error) {
        res.status(401).json({ error: "Invalid email or password." });
    }
};

// --- GOOGLE LOGIN ---
const googleLogin = async (req, res) => {
    try {
        const { idToken, profilePic } = req.body; // profilePic passed from frontend
        if (!idToken) return res.status(400).json({ error: "No Google token provided" });

        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        let userData;

        if (!userDoc.exists) {
            userData = {
                uid: uid,
                username: name || email.split('@')[0] || "Google User",
                email: email,
                profilePic: profilePic || picture || "", // Prioritize cartoon pic from frontend
                weight: 0,
                height: 0,
                bio: "",
                createdAt: new Date().toISOString(),
                role: "user",
                authMethod: "google"
            };
            await userRef.set(userData);
        } else {
            userData = userDoc.data();
            // Optional: Update profilePic if it's currently empty
            if (!userData.profilePic && profilePic) {
                await userRef.update({ profilePic });
                userData.profilePic = profilePic;
            }
        }

        res.json({ 
            message: "Success",
            token: idToken, 
            user: userData 
        });
    } catch (error) {
        res.status(401).json({ error: "Google Auth Failed" });
    }
};

// --- UPDATE USER (THE MISSING PIECE) ---
const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // This is the UID
        const updateData = req.body;

        // Security: Don't allow updating sensitive fields via this route if necessary
        delete updateData.role; 
        delete updateData.uid;

        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found in database" });
        }

        // Perform the update in Firestore
        await userRef.update(updateData);

        // Fetch updated document to send back to frontend
        const updatedDoc = await userRef.get();
        
        res.json({ 
            message: "Profile updated successfully", 
            user: updatedDoc.data() 
        });
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};

module.exports = { register, login, googleLogin, updateUser };