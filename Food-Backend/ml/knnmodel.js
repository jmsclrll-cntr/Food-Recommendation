const { getMemory } = require('./mlDataService');
const { getBmiCategory } = require('./utils');

exports.recommendGoal = (userGender, userBmi) => {
    const data = getMemory();
    const userCat = getBmiCategory(userBmi);
    const peers = data.filter(d => d.gender === userGender && d.bmiCategory === userCat);
    if (peers.length === 0) return { goal: null, category: userCat };
    const counts = {};
    peers.forEach(p => { counts[p.goal] = (counts[p.goal] || 0) + 1; });
    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return { goal: mostFrequent, category: userCat, frequency: counts[mostFrequent] };
};

exports.recommendFoodKNN = (foodPool, targetCalories, k = 10, excludeIds = new Set()) => {
    if (!foodPool || foodPool.length === 0) return [];
    
    let topK = [];
    
    for (let i = 0; i < foodPool.length; i++) {
        const food = foodPool[i];
        if (excludeIds.has(food.id)) continue;
        if ((food.grams || 0) <= 0) continue;
        
        const distance = Math.abs((food.calories || 0) - targetCalories);
        
        if (topK.length < k) {
            topK.push({ ...food, distance });
            topK.sort((a, b) => a.distance - b.distance);
        } else if (distance < topK[topK.length - 1].distance) {
            topK[topK.length - 1] = { ...food, distance };
            topK.sort((a, b) => a.distance - b.distance);
        }
    }

    if (topK.length === 0) return [];

    // Shuffle top-K to introduce variety across days
    for (let i = topK.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topK[i], topK[j]] = [topK[j], topK[i]];
    }
    
    return topK;
};