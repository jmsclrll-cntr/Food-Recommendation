const admin = require('firebase-admin');
const { getBmiCategory } = require('./utils'); 

let communityData = []; 

const syncMLData = async () => {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('health_logs').get();
        communityData = snapshot.docs.map(doc => ({
            gender: doc.data().gender || doc.data().Gender, 
            bmiCategory: getBmiCategory(doc.data().bmi),
            goal: doc.data().goal
        }));
    } catch (error) {
        console.error("❌ Sync failed");
    }
};

const getFoodDatabase = async (condition) => {
    const db = admin.firestore();
    const snapshot = await db.collection('foods').get();
    if (snapshot.empty) return [];
    let foods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (condition === 'diabetes') foods = foods.filter(f => f.sugar <= 5);
    if (condition === 'hypertension') foods = foods.filter(f => f.sodium <= 500);
    
    return foods;
};

const findMostFrequentGoal = (gender, bmi) => {
    const category = getBmiCategory(bmi);
    const filtered = communityData.filter(item => item.gender?.toLowerCase() === gender?.toLowerCase() && item.bmiCategory === category);
    if (filtered.length === 0) return { goal: "maintain", category };
    const counts = {};
    filtered.forEach(item => { counts[item.goal] = (counts[item.goal] || 0) + 1; });
    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return { goal: mostFrequent, category };
};

module.exports = { syncMLData, getFoodDatabase, findMostFrequentGoal };