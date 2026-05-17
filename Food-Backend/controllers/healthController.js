const admin = require('firebase-admin');
const { addToMemory } = require('../ml/mlDataService');
const { calculateBmr, calculateTdee, calculateTargetCalories } = require('../ml/utils');

exports.saveHealthProfile = async (req, res) => {
    const db = admin.firestore();
    try {
        const { userId, height, weight, bmi, goal, condition, gender, age, activity } = req.body;
        
        if (!userId) return res.status(400).json({ error: "User ID missing" });

        const parsedWeight = parseFloat(weight);
        const parsedHeight = parseFloat(height);
        const parsedAge = parseInt(age || 25, 10);
        const activeActivity = activity || 'moderate';

        const bmrVal = calculateBmr(parsedWeight, parsedHeight, parsedAge, gender);
        const tdeeVal = calculateTdee(parsedWeight, parsedHeight, parsedAge, gender, activeActivity);
        const targetVal = calculateTargetCalories(parseFloat(bmi), gender, goal, parsedWeight, parsedHeight, parsedAge, activeActivity);

        await db.collection('health_logs').add({
            userId,
            gender,
            height: parsedHeight,
            weight: parsedWeight,
            bmi: parseFloat(bmi),
            goal,
            condition,
            age: parsedAge,
            activity: activeActivity,
            bmr: bmrVal,
            tdee: tdeeVal,
            targetCalories: targetVal,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        addToMemory({ gender, bmi: parseFloat(bmi), goal });

        res.status(200).json({ 
            message: "Health log added successfully",
            bmr: bmrVal,
            tdee: tdeeVal,
            targetCalories: targetVal
        });
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
    const { gender, height, weight, goal, condition, bmi, age, activity } = req.body;

    try {
        const parsedWeight = parseFloat(weight);
        const parsedHeight = parseFloat(height);
        const parsedAge = parseInt(age || 25, 10);
        const activeActivity = activity || 'moderate';

        const bmrVal = calculateBmr(parsedWeight, parsedHeight, parsedAge, gender);
        const tdeeVal = calculateTdee(parsedWeight, parsedHeight, parsedAge, gender, activeActivity);
        const targetVal = calculateTargetCalories(parseFloat(bmi), gender, goal, parsedWeight, parsedHeight, parsedAge, activeActivity);

        // 1. Search for the user's log
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
            height: parsedHeight,
            weight: parsedWeight,
            bmi: parseFloat(bmi),
            goal,
            condition,
            age: parsedAge,
            activity: activeActivity,
            bmr: bmrVal,
            tdee: tdeeVal,
            targetCalories: targetVal,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. IMPORTANT: Sync with ML Memory
        addToMemory({ gender, bmi: parseFloat(bmi), goal });

        return res.status(200).json({ 
            message: "Analysis updated successfully.",
            bmr: bmrVal,
            tdee: tdeeVal,
            targetCalories: targetVal
        });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
};