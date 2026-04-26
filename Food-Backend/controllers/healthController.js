const admin = require('firebase-admin');

// SAVE or UPDATE the profile
exports.saveHealthProfile = async (req, res) => {
    const db = admin.firestore();
    try {
        const { userId, height, weight, bmi, goal, condition } = req.body;
        
        if (!userId) return res.status(400).json({ error: "User ID missing" });

        // Using userId as the Document ID so each user has exactly ONE profile
        await db.collection('health_profiles').doc(userId).set({
            userId,
            height: parseFloat(height),
            weight: parseFloat(weight),
            bmi: parseFloat(bmi),
            goal,
            condition,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET the profile for tracking
exports.getHealthProfile = async (req, res) => {
    const db = admin.firestore();
    try {
        const { userId } = req.params;
        const doc = await db.collection('health_profiles').doc(userId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "No profile found" });
        }

        res.status(200).json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};