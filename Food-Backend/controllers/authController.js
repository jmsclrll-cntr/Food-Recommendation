const { auth, db } = require('../config/firebase'); 
const axios = require('axios');
const { sendOTPEmail, sendResetPasswordOTPEmail } = require('../utils/emailService');
require('dotenv').config();

// --- SEND OTP ---
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email address is required." });
        }

        // Check if email already exists in Firebase Auth
        try {
            await auth.getUserByEmail(email);
            // User exists
            return res.status(400).json({ error: "This email is already registered." });
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                console.error("Firebase getUser Error:", error);
                return res.status(500).json({ error: "Verification check failed: " + error.message });
            }
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to Firestore
        await db.collection('otps').doc(email).set({
            email,
            otp,
            createdAt: new Date().toISOString()
        });

        // Send Email
        const result = await sendOTPEmail(email, otp);

        res.status(200).json({
            message: "A 6-digit verification code has been sent to your email address.",
            method: result.method,
            devCode: (result.method === 'console' || result.method === 'console_fallback') ? otp : undefined
        });
    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ error: "Failed to send verification code: " + error.message });
    }
};

// --- REGISTER ---
const register = async (req, res) => {
    try {
        const { email, password, username, name, otp } = req.body;

        // 1. Validation
        if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
        if (!otp) return res.status(400).json({ error: "Verification code is required" });
        
        // 2. Verify OTP
        const otpDoc = await db.collection('otps').doc(email).get();
        if (!otpDoc.exists) {
            return res.status(400).json({ error: "No verification code requested for this email. Please request a new one." });
        }

        const otpData = otpDoc.data();
        if (otpData.otp !== otp) {
            return res.status(400).json({ error: "Invalid verification code. Please check your email." });
        }

        // Check expiry (10 minutes)
        const expiryTime = 10 * 60 * 1000;
        const timeElapsed = Date.now() - new Date(otpData.createdAt).getTime();
        if (timeElapsed > expiryTime) {
            return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
        }

        // Delete the verified OTP
        await db.collection('otps').doc(email).delete();

        // 3. FIRESTORE FIX: Ensure username is NEVER undefined
        const finalUsername = username || name || email.split('@')[0] || "New User";

        // 4. Create user in Firebase AUTH
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: finalUsername,
        });

        // 5. Save to Firestore (Fail-safe)
        const userData = {
            uid: userRecord.uid,
            username: finalUsername,
            email: email,
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
        console.error("Register Error:", error.code || error.message);
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

// --- DELETE ACCOUNT ---
const deleteAccount = async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: "User ID is required to delete an account." });
        }

        // 1. Delete from Firebase Auth
        try {
            await auth.deleteUser(uid);
        } catch (authError) {
            console.error("Firebase Auth Deletion Error:", authError);
            if (authError.code !== 'auth/user-not-found') {
                // If the error is anything other than user-not-found, we should probably stop
                // or at least log it. But we still want to delete the Firestore document if possible.
            }
        }

        // 2. Delete from Firestore
        await db.collection('users').doc(uid).delete();

        res.status(200).json({ message: "Account successfully deleted." });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ error: "Failed to delete account: " + error.message });
    }
};

// --- UPDATE PROFILE ---
const updateProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const { username, personalNarrative, email, profilePic } = req.body;
        if (!uid) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (personalNarrative !== undefined) updateData.personalNarrative = personalNarrative;
        if (email !== undefined) updateData.email = email;
        if (profilePic !== undefined) updateData.profilePic = profilePic;

        // Guard: if nothing to update, return early
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields provided to update." });
        }

        // Update Firestore
        await db.collection('users').doc(uid).update(updateData);

        // Fetch updated user
        const updatedDoc = await db.collection('users').doc(uid).get();
        const updatedData = updatedDoc.data();

        // Update Firebase Auth display name if username changed
        if (username) {
            await auth.updateUser(uid, {
                displayName: username
            });
        }

        res.status(200).json({ 
            message: "Profile updated successfully.",
            user: updatedData
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Failed to update profile: " + error.message });
    }
};

// --- GET PROFILE ---
const getProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        if (!uid) return res.status(400).json({ error: "User ID missing" });

        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "User profile not found." });
        }
        res.status(200).json(doc.data());
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- FORGOT PASSWORD SEND OTP ---
const forgotPasswordSendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email address is required." });
        }

        // Check if user exists in Firebase Auth
        try {
            await auth.getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(400).json({ error: "No account found with this email address." });
            }
            console.error("Firebase getUser Error:", error);
            return res.status(500).json({ error: "Verification check failed: " + error.message });
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to Firestore under 'forgot_password_otps'
        await db.collection('forgot_password_otps').doc(email).set({
            email,
            otp,
            createdAt: new Date().toISOString()
        });

        // Send Email
        const result = await sendResetPasswordOTPEmail(email, otp);

        res.status(200).json({
            message: "A 6-digit verification code has been sent to your email address.",
            method: result.method,
            devCode: (result.method === 'console' || result.method === 'console_fallback') ? otp : undefined
        });
    } catch (error) {
        console.error("Forgot Password OTP Error:", error);
        res.status(500).json({ error: "Failed to send verification code: " + error.message });
    }
};

// --- RESET PASSWORD WITH OTP ---
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: "Email, verification code, and new password are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        // 1. Verify OTP
        const otpDoc = await db.collection('forgot_password_otps').doc(email).get();
        if (!otpDoc.exists) {
            return res.status(400).json({ error: "No verification code requested or it has expired. Please request a new one." });
        }

        const otpData = otpDoc.data();
        if (otpData.otp !== otp) {
            return res.status(400).json({ error: "Invalid verification code. Please check your email." });
        }

        // Check expiry (10 minutes)
        const expiryTime = 10 * 60 * 1000;
        const timeElapsed = Date.now() - new Date(otpData.createdAt).getTime();
        if (timeElapsed > expiryTime) {
            return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
        }

        // 2. Delete the verified OTP doc
        await db.collection('forgot_password_otps').doc(email).delete();

        // 3. Find user and update in Firebase Auth
        const userRecord = await auth.getUserByEmail(email);
        await auth.updateUser(userRecord.uid, { password: newPassword });

        res.status(200).json({
            message: "Password reset successfully! You can now sign in with your new password."
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: "Failed to reset password: " + error.message });
    }
};

module.exports = { 
    register, 
    login, 
    googleLogin, 
    sendOTP, 
    deleteAccount, 
    updateProfile, 
    getProfile,
    forgotPasswordSendOTP,
    resetPasswordWithOTP
};