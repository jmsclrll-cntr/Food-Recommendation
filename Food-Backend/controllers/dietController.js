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

/**
 * Delete active weekly plan for a user across all 7 collections
 */
exports.deleteWeeklyPlan = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const batch = db.batch();

        days.forEach(day => {
            const collectionName = `${day}Plans`;
            const docRef = db.collection(collectionName).doc(userId);
            batch.delete(docRef);
        });

        await batch.commit();

        res.status(200).json({ 
            message: "Weekly plan successfully cleared in database.",
            status: "deleted"
        });
    } catch (error) {
        console.error("Delete Plan Error:", error);
        res.status(500).json({ error: "Failed to delete plan: " + error.message });
    }
};

/**
 * Seed a user's account with 2 weeks of simulated diet history and weight history
 */
exports.seedProgress = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required for seeding." });
        }

        // 1. Delete existing history for user
        const batch = db.batch();
        const historySnapshot = await db.collection('dietHistory').where('userId', '==', userId).get();
        historySnapshot.forEach(doc => batch.delete(doc.ref));
        
        const weightSnapshot = await db.collection('weight_history').where('userId', '==', userId).get();
        weightSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // 2. Generate random diet plans
        const mockMealsWeek1 = () => ({
            breakfast: [
                { name: "Organic Rolled Oats with Bananas & Chia Seeds", calories: 380, grams: 220, sugar: 6 },
                { name: "Fresh Strawberries & Green Tea", calories: 60, grams: 150, sugar: 4 }
            ],
            lunch: [
                { name: "Extra Lean Grilled Chicken Breast Salad", calories: 520, grams: 380, sugar: 2 },
                { name: "Steamed Quinoa side dish", calories: 120, grams: 100, sugar: 0 }
            ],
            dinner: [
                { name: "Wild Pan-Seared Salmon with Asparagus Spears", calories: 480, grams: 320, sugar: 0 },
                { name: "Fresh Baby Spinach Salad with Lemon Vinaigrette", calories: 90, grams: 120, sugar: 1 }
            ]
        });

        const mockMealsWeek2 = () => ({
            breakfast: [
                { name: "Egg White Omelet with Mushrooms & Avocado Slice", calories: 340, grams: 180, sugar: 1 },
                { name: "Steamed Sweet Potato", calories: 110, grams: 100, sugar: 3 }
            ],
            lunch: [
                { name: "Mediterranean Baked Tuna Fillet with Mixed Greens", calories: 490, grams: 340, sugar: 1 },
                { name: "Organic Steamed Brown Rice", calories: 130, grams: 110, sugar: 0 }
            ],
            dinner: [
                { name: "Roasted Turkey Breast with Lemon-Herb Seasoning", calories: 420, grams: 280, sugar: 0 },
                { name: "Sautéed Broccoli & Garlic Florets", calories: 80, grams: 150, sugar: 1 }
            ]
        });

        const mockMealsWeek3 = () => ({
            breakfast: [
                { name: "Greek Yogurt with Mixed Berries & Pumpkin Seeds", calories: 310, grams: 200, sugar: 8 },
                { name: "Green Matcha Tea", calories: 45, grams: 120, sugar: 0 }
            ],
            lunch: [
                { name: "Steamed Sea Bass with Roasted Asparagus", calories: 410, grams: 300, sugar: 1 },
                { name: "Brown Rice side dish", calories: 140, grams: 110, sugar: 0 }
            ],
            dinner: [
                { name: "Lemon-Herb Tofu Stir-Fry with Bok Choy", calories: 360, grams: 280, sugar: 2 },
                { name: "Steamed Broccoli Florets", calories: 70, grams: 120, sugar: 1 }
            ]
        });

        const mockMealsWeek4 = () => ({
            breakfast: [
                { name: "Chia Seed Pudding with Almond Milk & Mango", calories: 290, grams: 180, sugar: 9 },
                { name: "Black Coffee", calories: 5, grams: 200, sugar: 0 }
            ],
            lunch: [
                { name: "Grilled Turkey Wrap with Lettuce & Hummus", calories: 460, grams: 250, sugar: 3 },
                { name: "Mixed Vegetable Sticks", calories: 50, grams: 100, sugar: 2 }
            ],
            dinner: [
                { name: "Baked Cod Fillet with Roasted Zucchini", calories: 380, grams: 270, sugar: 1 },
                { name: "Steamed Quinoa side dish", calories: 130, grams: 100, sugar: 0 }
            ]
        });

        const mockMealsWeek5 = () => ({
            breakfast: [
                { name: "Avocado Toast on Whole Grain with Poached Egg", calories: 390, grams: 160, sugar: 1 },
                { name: "Herbal Hibiscus Tea", calories: 10, grams: 150, sugar: 0 }
            ],
            lunch: [
                { name: "Quinoa Salad with Cucumbers, Tomatoes & Feta", calories: 430, grams: 320, sugar: 4 },
                { name: "Roasted Chickpeas", calories: 150, grams: 80, sugar: 0 }
            ],
            dinner: [
                { name: "Grilled Chicken Breast with Sweet Potato", calories: 510, grams: 340, sugar: 3 },
                { name: "Mixed Greens Side Salad", calories: 80, grams: 110, sugar: 1 }
            ]
        });

        const mockPlan1 = {};
        const mockPlan2 = {};
        const mockPlan3 = {};
        const mockPlan4 = {};
        const mockPlan5 = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            mockPlan1[day] = mockMealsWeek1();
            mockPlan2[day] = mockMealsWeek2();
            mockPlan3[day] = mockMealsWeek3();
            mockPlan4[day] = mockMealsWeek4();
            mockPlan5[day] = mockMealsWeek5();
        });

        // Dates helper
        const getDateOffset = (offsetDays) => {
            const d = new Date();
            d.setDate(d.getDate() - offsetDays);
            return d;
        };

        const date35DaysAgo = getDateOffset(35);
        const date28DaysAgo = getDateOffset(28);
        const date21DaysAgo = getDateOffset(21);
        const date14DaysAgo = getDateOffset(14);
        const date7DaysAgo = getDateOffset(7);

        // Save diet histories
        await db.collection('dietHistory').add({
            userId,
            plan: mockPlan1,
            savedAt: admin.firestore.Timestamp.fromDate(date35DaysAgo),
            archivedAt: admin.firestore.Timestamp.fromDate(date35DaysAgo),
            completion: 100
        });

        await db.collection('dietHistory').add({
            userId,
            plan: mockPlan2,
            savedAt: admin.firestore.Timestamp.fromDate(date28DaysAgo),
            archivedAt: admin.firestore.Timestamp.fromDate(date28DaysAgo),
            completion: 100
        });

        await db.collection('dietHistory').add({
            userId,
            plan: mockPlan3,
            savedAt: admin.firestore.Timestamp.fromDate(date21DaysAgo),
            archivedAt: admin.firestore.Timestamp.fromDate(date21DaysAgo),
            completion: 100
        });

        await db.collection('dietHistory').add({
            userId,
            plan: mockPlan4,
            savedAt: admin.firestore.Timestamp.fromDate(date14DaysAgo),
            archivedAt: admin.firestore.Timestamp.fromDate(date14DaysAgo),
            completion: 100
        });

        await db.collection('dietHistory').add({
            userId,
            plan: mockPlan5,
            savedAt: admin.firestore.Timestamp.fromDate(date7DaysAgo),
            archivedAt: admin.firestore.Timestamp.fromDate(date7DaysAgo),
            completion: 100
        });

        // 3. Find User's height & active weight to construct weight history
        const healthSnapshot = await db.collection('health_logs').where('userId', '==', userId).limit(1).get();
        let height = 1.75;
        let currentWeight = 79.2;

        if (!healthSnapshot.empty) {
            const hData = healthSnapshot.docs[0].data();
            height = parseFloat(hData.height) || 1.75;
            currentWeight = parseFloat(hData.weight) || 79.2;
        } else {
            // Create a default log
            await db.collection('health_logs').add({
                userId,
                gender: "male",
                height,
                weight: currentWeight,
                bmi: parseFloat((currentWeight / (height * height)).toFixed(1)),
                goal: "lose",
                condition: [],
                age: 25,
                activity: "moderate",
                createdAt: admin.firestore.Timestamp.fromDate(new Date())
            });
        }

        const startingWeight = currentWeight + 5.8; // Calibrate so progress shows weight loss
        
        // Seed weights
        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(startingWeight.toFixed(1)),
            bmi: parseFloat((startingWeight / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(date35DaysAgo)
        });

        const w28 = startingWeight - 1.2;
        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(w28.toFixed(1)),
            bmi: parseFloat((w28 / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(date28DaysAgo)
        });

        const w21 = startingWeight - 2.3;
        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(w21.toFixed(1)),
            bmi: parseFloat((w21 / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(date21DaysAgo)
        });

        const w14 = startingWeight - 3.5;
        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(w14.toFixed(1)),
            bmi: parseFloat((w14 / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(date14DaysAgo)
        });

        const w7 = startingWeight - 4.6;
        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(w7.toFixed(1)),
            bmi: parseFloat((w7 / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(date7DaysAgo)
        });

        await db.collection('weight_history').add({
            userId,
            weight: parseFloat(currentWeight.toFixed(1)),
            bmi: parseFloat((currentWeight / (height * height)).toFixed(1)),
            createdAt: admin.firestore.Timestamp.fromDate(new Date())
        });

        res.status(200).json({
            message: "Successfully seeded 5 weeks of diet and BMI reduction history!",
            userId
        });
    } catch (error) {
        console.error("Seed Progress Error:", error);
        res.status(500).json({ error: "Failed to seed progress: " + error.message });
    }
};
