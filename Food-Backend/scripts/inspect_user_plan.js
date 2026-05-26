const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

const run = async () => {
    try {
        const userRecord = await auth.getUserByEmail('cantrejames33@gmail.com');
        const uid = userRecord.uid;
        console.log(`Found user cantrejames33@gmail.com with UID: ${uid}`);

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (const day of days) {
            const doc = await db.collection(`${day}Plans`).doc(uid).get();
            if (doc.exists) {
                console.log(`\n--- Plan for ${day} ---`);
                const data = doc.data();
                console.log(`Saved at: ${data.savedAt?.toDate().toISOString()}`);
                
                ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                    const meals = data.meals?.[mealType] || [];
                    console.log(`  ${mealType.toUpperCase()}:`);
                    meals.forEach(m => {
                        console.log(`    - Name: "${m.name}"`);
                        console.log(`      Calories: ${m.calories}, Grams: ${m.grams}`);
                        console.log(`      Ingredients: ${JSON.stringify(m.ingredients)}`);
                        console.log(`      Protein: ${m.protein}, Carbs: ${m.carbs}, Fat: ${m.fat}`);
                    });
                });
            } else {
                console.log(`No saved plan for ${day}`);
            }
        }
    } catch (e) {
        console.error("Error inspecting:", e);
    }
};

run().then(() => process.exit(0));
