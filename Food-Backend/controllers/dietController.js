const admin = require('firebase-admin');
const db = admin.firestore();

exports.saveWeeklyPlan = async (req, res) => {
    try {
        const { userId, plan, currentPlanCompletion } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required to save the plan." });
        }
        if (!plan || typeof plan !== 'object') {
            return res.status(400).json({ error: "A valid 7-day plan object is required." });
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // 1. Fetch current active plan to archive it
        const currentActivePlan = {};
        let originalSavedAt = null;

        const fetchPromises = days.map(async (day) => {
            const doc = await db.collection(`${day}Plans`).doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                currentActivePlan[day] = data.meals;
                if (data.savedAt) {
                    originalSavedAt = data.savedAt;
                }
            }
        });
        await Promise.all(fetchPromises);

        // 2. If it exists, write it to dietHistory collection
        if (Object.keys(currentActivePlan).length > 0) {
            const completion = currentPlanCompletion !== undefined ? currentPlanCompletion : 0;
            await db.collection('dietHistory').add({
                userId,
                plan: currentActivePlan,
                savedAt: originalSavedAt || admin.firestore.FieldValue.serverTimestamp(),
                archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                completion
            });
        }

        // 3. Save new plan
        const batch = db.batch();

        days.forEach(day => {
            if (plan[day]) {
                const collectionName = `${day}Plans`;
                // Use userId as the document ID so each user has exactly one entry per day
                const docRef = db.collection(collectionName).doc(userId);
                
                batch.set(docRef, {
                    userId,
                    day,
                    meals: plan[day],
                    savedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();

        res.status(200).json({ 
            message: "Success! Your 7-day diet has been synchronized across 7 dedicated day collections.",
            status: "synchronized"
        });

    } catch (error) {
        console.error("Save Plan Error:", error);
        res.status(500).json({ error: "Failed to save plan: " + error.message });
    }
};

/**
 * Get a specific day's plan for a user
 */
exports.getDayPlan = async (req, res) => {
    try {
        const { userId, day } = req.params;
        const collectionName = `${day}Plans`;
        const doc = await db.collection(collectionName).doc(userId).get();

        if (!doc.exists) {
            return res.status(404).json({ error: `No saved plan found for ${day}` });
        }

        res.status(200).json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Retrieves the full 7-day plan by querying all 7 collections
 */
exports.getWeeklyPlan = async (req, res) => {
    try {
        const { userId } = req.params;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const fullPlan = {};

        // Fetch all 7 collections in parallel for maximum performance
        const fetchPromises = days.map(async (day) => {
            const collectionName = `${day}Plans`;
            const doc = await db.collection(collectionName).doc(userId).get();
            if (doc.exists) {
                // Return the whole document so we have savedAt
                fullPlan[day] = doc.data();
            }
        });

        await Promise.all(fetchPromises);

        if (Object.keys(fullPlan).length === 0) {
            return res.status(404).json({ error: "No saved weekly plan found for this user." });
        }

        res.status(200).json(fullPlan);
    } catch (error) {
        console.error("Fetch Weekly Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Retrieves the user's historical diet plans from the dietHistory collection
 */
exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('dietHistory')
            .where('userId', '==', userId)
            .get();

        const historyList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            historyList.push({
                id: doc.id,
                ...data
            });
        });

        // Sort by savedAt descending
        historyList.sort((a, b) => {
            const timeA = a.savedAt ? (a.savedAt._seconds || new Date(a.savedAt).getTime() / 1000) : 0;
            const timeB = b.savedAt ? (b.savedAt._seconds || new Date(b.savedAt).getTime() / 1000) : 0;
            return timeB - timeA;
        });

        res.status(200).json(historyList);
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ error: error.message });
    }
};
