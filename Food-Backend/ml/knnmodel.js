const { findMostFrequentGoal } = require('./mlDataService');

/** KNN-style goal from users with same gender + BMI category (via community memory). */
exports.recommendGoal = (userGender, userBmi) => {
    return findMostFrequentGoal(userGender, userBmi);
};

/**
 * KNN: nearest calories to target (deterministic — no random shuffle).
 */
exports.recommendFoodKNN = (foodPool, targetCalories, k = 10, excludeIds = new Set()) => {
    if (!foodPool || foodPool.length === 0) return [];

    const scored = [];

    for (let i = 0; i < foodPool.length; i++) {
        const food = foodPool[i];
        if (excludeIds.has(food.id)) continue;
        if ((food.grams || 0) <= 0) continue;

        const distance = Math.abs((food.calories || 0) - targetCalories);
        scored.push({ ...food, distance });
    }

    scored.sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return String(a.id).localeCompare(String(b.id));
    });

    return scored.slice(0, k);
};
