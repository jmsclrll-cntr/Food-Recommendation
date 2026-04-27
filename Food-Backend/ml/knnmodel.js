const { getMemory } = require('./mlDataService');
const { getBmiCategory } = require('./utils');

exports.recommendGoal = (userGender, userBmi) => {
    const data = getMemory();
    const userCat = getBmiCategory(userBmi);

    // Filter peers with same gender and BMI category
    const peers = data.filter(d => d.gender === userGender && d.bmiCategory === userCat);

    if (peers.length === 0) return { goal: null, category: userCat };

    // Count goal frequencies
    const counts = {};
    peers.forEach(p => {
        counts[p.goal] = (counts[p.goal] || 0) + 1;
    });

    // Find the most frequent goal
    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    return {
        goal: mostFrequent,
        category: userCat,
        frequency: counts[mostFrequent]
    };
};