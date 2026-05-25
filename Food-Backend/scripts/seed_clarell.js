const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

const seedClarell = async () => {
    console.log("Starting DB seeding for clarell (cantrejames33@gmail.com)...");
    
    let uid = null;
    let username = "clarell";
    
    // 1. Try to find user in Firebase Auth
    try {
        const userRecord = await auth.getUserByEmail('cantrejames33@gmail.com');
        uid = userRecord.uid;
        username = userRecord.displayName || "clarell";
        console.log(`Found user in Firebase Auth: uid = ${uid}, username = ${username}`);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log("User cantrejames33@gmail.com not found in Firebase Auth. Let's create the account in Auth!");
            // Create user in Firebase Auth
            const userRecord = await auth.createUser({
                email: 'cantrejames33@gmail.com',
                password: 'james123',
                displayName: 'clarell'
            });
            uid = userRecord.uid;
            console.log(`Successfully created Auth user with uid: ${uid}`);
        } else {
            console.error("Firebase Auth Lookup Error:", error);
            process.exit(1);
        }
    }

    // 2. Ensure user document exists in Firestore 'users' collection
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        console.log("Creating user document in Firestore 'users' collection...");
        await userDocRef.set({
            uid,
            username,
            email: 'cantrejames33@gmail.com',
            createdAt: new Date().toISOString(),
            role: "user",
            authMethod: "email"
        });
    }

    // 3. Clear existing dietHistory and weight_history collections for this user
    console.log("Cleaning up existing dietHistory & weight_history records for user...");
    const batch = db.batch();
    
    const historySnapshot = await db.collection('dietHistory').where('userId', '==', uid).get();
    historySnapshot.forEach(doc => batch.delete(doc.ref));
    
    const weightSnapshot = await db.collection('weight_history').where('userId', '==', uid).get();
    weightSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log("Cleanup finished.");

    // 4. Generate beautiful, rich weekly meal plans for seeding
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

    // 5. Seed 5 weeks of diet history with 100% completion
    console.log("Seeding weekly diet history records...");
    
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

    // Week 1 (35 days ago)
    await db.collection('dietHistory').add({
        userId: uid,
        plan: mockPlan1,
        savedAt: admin.firestore.Timestamp.fromDate(date35DaysAgo),
        archivedAt: admin.firestore.Timestamp.fromDate(date35DaysAgo),
        completion: 100
    });

    // Week 2 (28 days ago)
    await db.collection('dietHistory').add({
        userId: uid,
        plan: mockPlan2,
        savedAt: admin.firestore.Timestamp.fromDate(date28DaysAgo),
        archivedAt: admin.firestore.Timestamp.fromDate(date28DaysAgo),
        completion: 100
    });

    // Week 3 (21 days ago)
    await db.collection('dietHistory').add({
        userId: uid,
        plan: mockPlan3,
        savedAt: admin.firestore.Timestamp.fromDate(date21DaysAgo),
        archivedAt: admin.firestore.Timestamp.fromDate(date21DaysAgo),
        completion: 100
    });

    // Week 4 (14 days ago)
    await db.collection('dietHistory').add({
        userId: uid,
        plan: mockPlan4,
        savedAt: admin.firestore.Timestamp.fromDate(date14DaysAgo),
        archivedAt: admin.firestore.Timestamp.fromDate(date14DaysAgo),
        completion: 100
    });

    // Week 5 (7 days ago)
    await db.collection('dietHistory').add({
        userId: uid,
        plan: mockPlan5,
        savedAt: admin.firestore.Timestamp.fromDate(date7DaysAgo),
        archivedAt: admin.firestore.Timestamp.fromDate(date7DaysAgo),
        completion: 100
    });

    // 6. Ensure health profile document exists in Firestore 'health_logs'
    console.log("Ensuring user health logs exist...");
    const healthLogsSnapshot = await db.collection('health_logs').where('userId', '==', uid).limit(1).get();
    
    let height = 1.75;
    let startingWeight = 85.0; // Starting weight before 5 weeks
    let currentWeight = 79.2;  // Current weight after 5 weeks of organic meals

    if (!healthLogsSnapshot.empty) {
        const logData = healthLogsSnapshot.docs[0].data();
        height = parseFloat(logData.height) || 1.75;
        currentWeight = parseFloat(logData.weight) || 79.2;
        startingWeight = currentWeight + 5.8; // Calibrate so progress shows loss
        console.log(`Using existing user height (${height}m) and weight (${currentWeight}kg). Calibrating start weight to ${startingWeight}kg.`);
    } else {
        console.log(`No active health logs found. Creating default health profile logs...`);
        // Save standard health profile document
        const bmr = 10 * currentWeight + 6.25 * (height * 100) - 5 * 25 + 5; // Mifflin-St Jeor
        await db.collection('health_logs').add({
            userId: uid,
            gender: "male",
            height,
            weight: currentWeight,
            bmi: parseFloat((currentWeight / (height * height)).toFixed(1)),
            goal: "lose",
            condition: ["Diabetes"],
            age: 25,
            activity: "moderate",
            bmr,
            tdee: bmr * 1.375,
            targetCalories: bmr * 1.375 - 500,
            createdAt: admin.firestore.Timestamp.fromDate(new Date())
        });
    }

    // 7. Seed Weight History (6 Progression Points over 5 weeks)
    console.log("Seeding weight and BMI tracking timeline...");
    
    // Weight 35 days ago (Starting Weight)
    const bmi35 = startingWeight / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(startingWeight.toFixed(1)),
        bmi: parseFloat(bmi35.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(date35DaysAgo)
    });

    // Weight 28 days ago
    const w28 = startingWeight - 1.2;
    const bmi28 = w28 / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(w28.toFixed(1)),
        bmi: parseFloat(bmi28.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(date28DaysAgo)
    });

    // Weight 21 days ago
    const w21 = startingWeight - 2.3;
    const bmi21 = w21 / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(w21.toFixed(1)),
        bmi: parseFloat(bmi21.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(date21DaysAgo)
    });

    // Weight 14 days ago
    const w14 = startingWeight - 3.5;
    const bmi14 = w14 / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(w14.toFixed(1)),
        bmi: parseFloat(bmi14.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(date14DaysAgo)
    });

    // Weight 7 days ago
    const w7 = startingWeight - 4.6;
    const bmi7 = w7 / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(w7.toFixed(1)),
        bmi: parseFloat(bmi7.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(date7DaysAgo)
    });

    // Weight Today (Current Weight)
    const bmiToday = currentWeight / (height * height);
    await db.collection('weight_history').add({
        userId: uid,
        weight: parseFloat(currentWeight.toFixed(1)),
        bmi: parseFloat(bmiToday.toFixed(1)),
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    });

    console.log("---------------------------------------------------------");
    console.log("🎉 SUCCESS! Seed script finished successfully!");
    console.log(`Seeded account: cantrejames33@gmail.com (clarell)`);
    console.log(`Successfully simulated 5 weeks of diet and BMI reduction history.`);
    console.log("---------------------------------------------------------");
};

seedClarell().then(() => process.exit(0)).catch(err => {
    console.error("❌ Seeding Script Failed:", err);
    process.exit(1);
});
