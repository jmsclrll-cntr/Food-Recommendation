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
        // MAHALAGA: Para makita mo sa terminal kung bakit nag-error ang save
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
            .orderBy('createdAt', 'desc')
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