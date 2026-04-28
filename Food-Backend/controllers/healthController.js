const admin = require('firebase-admin');
const { addToMemory } = require('../ml/mlDataService');

exports.saveHealthProfile = async (req, res) => {
    const db = admin.firestore();
    try {
        const { userId, height, weight, bmi, goal, condition, gender } = req.body;
        
        if (!userId) return res.status(400).json({ error: "User ID missing" });

        await db.collection('health_logs').add({
            userId,
            gender,
            height: parseFloat(height),
            weight: parseFloat(weight),
            bmi: parseFloat(bmi),
            goal,
            condition,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        addToMemory({ gender, bmi: parseFloat(bmi), goal });

        res.status(200).json({ message: "Health log added successfully" });
    } catch (error) {
        console.error("SAVE ERROR:", error); 
        res.status(500).json({ error: error.message });
    }
};

exports.getHealthProfile = async (req, res) => {
    const db = admin.firestore();
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('health_logs')
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No data found" });
        }

        const data = snapshot.docs[0].data();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// FIXED: Changed 'export const' to 'exports' to stop the SyntaxError
// FIXED: Changed SQL to Firebase so it matches the rest of your working file
exports.updateHealthData = async (req, res) => {
    const db = admin.firestore();
    const { userId } = req.params;
    const { gender, height, weight, goal, condition, bmi } = req.body;

    try {
        // 1. Search for the user's log
        // We remove .orderBy temporarily to avoid the Firebase 500 Index Error
        const snapshot = await db.collection('health_logs')
            .where('userId', '==', userId)
            .limit(1) 
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "No profile found to update" });
        }

        const docId = snapshot.docs[0].id;

        // 2. Perform the update
        await db.collection('health_logs').doc(docId).update({
            gender,
            height: parseFloat(height),
            weight: parseFloat(weight),
            bmi: parseFloat(bmi),
            goal,
            condition,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. IMPORTANT: Sync with ML Memory
        // This ensures the 7-day diet plan updates immediately after the click
        addToMemory({ gender, bmi: parseFloat(bmi), goal });

        return res.status(200).json({ message: "Analysis updated successfully." });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
};