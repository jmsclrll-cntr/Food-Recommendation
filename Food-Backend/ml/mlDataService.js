const admin = require('firebase-admin');
const { getBmiCategory } = require('./utils'); 

let communityData = []; 

const syncMLData = async () => {
    const db = admin.firestore();
    try {
        console.log("🔄 Syncing ML Data from 'health_logs'...");
        const snapshot = await db.collection('health_logs').get();
        
        communityData = snapshot.docs.map(doc => ({
            gender: doc.data().gender,
            bmiCategory: getBmiCategory(doc.data().bmi),
            goal: doc.data().goal
        }));
        
        console.log(`✅ Sync Complete: ${communityData.length} records loaded.`);
    } catch (error) {
        console.error("❌ Sync Failed:", error);
    }
};

// BAGONG FUNCTION: Para sa Recommendation
const findMostFrequentGoal = (gender, bmi) => {
    const category = getBmiCategory(bmi);
    
    // Filter data base sa profile ng current user
    const filtered = communityData.filter(item => 
        item.gender?.toLowerCase() === gender?.toLowerCase() && 
        item.bmiCategory === category
    );

    // Default kung wala pang sapat na data sa database
    if (filtered.length === 0) return { goal: "maintain", category };

    // Bilangin ang dalas ng bawat goal (Frequency Count)
    const counts = {};
    filtered.forEach(item => {
        counts[item.goal] = (counts[item.goal] || 0) + 1;
    });

    // Hanapin ang "Mode" o ang pinaka-madalas lumabas
    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    return {
        goal: mostFrequent, // 'lose', 'gain', or 'maintain'
        category: category
    };
};

const getMemory = () => communityData;

const addToMemory = (newData) => {
    communityData.push({
        gender: newData.gender,
        bmiCategory: getBmiCategory(newData.bmi),
        goal: newData.goal
    });
};

module.exports = { syncMLData, getMemory, addToMemory, findMostFrequentGoal };