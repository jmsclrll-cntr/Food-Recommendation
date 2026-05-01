const { findMostFrequentGoal, getFoodDatabase } = require('../ml/mlDataService');
const { recommendFoodKNN } = require('../ml/knnmodel');

exports.getSuggestion = (req, res) => {
    try {
        const { gender, bmi } = req.query;
        const result = findMostFrequentGoal(gender, parseFloat(bmi));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWeeklySuggestion  = async (req, res) => {
    try {
        // Ensure values are numbers
        const weight = parseFloat(req.body.weight);
        const height = parseFloat(req.body.height);
        const age = parseFloat(req.body.age || 25);
        const { gender, goal, condition, bmi } = req.body;

        // 1. Calculate Target Calories (TDEE)
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = (gender.toLowerCase() === 'male') ? bmr + 5 : bmr - 161;
        let tdee = bmr * 1.3; 

        if (goal === 'lose') tdee -= 500;
        if (goal === 'gain') tdee += 500;

        // 2. Get Foods
        const foodPool = await getFoodDatabase(condition);
        if (foodPool.length === 0) throw new Error("No suitable foods found.");

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let weeklyPlan = {};
        const targets = { breakfast: tdee * 0.3, lunch: tdee * 0.4, dinner: tdee * 0.3 };

        days.forEach(day => {
            const bPool = foodPool.filter(f => f.type === 'breakfast');
            const lPool = foodPool.filter(f => f.type === 'lunch');
            const dPool = foodPool.filter(f => f.type === 'dinner');

            // Find closest matches
            const bOptions = recommendFoodKNN(bPool.length > 0 ? bPool : foodPool, targets.breakfast);
            const lOptions = recommendFoodKNN(lPool.length > 0 ? lPool : foodPool, targets.lunch);
            const dOptions = recommendFoodKNN(dPool.length > 0 ? dPool : foodPool, targets.dinner);

            weeklyPlan[day] = {
                breakfast: bOptions[Math.floor(Math.random() * bOptions.length)],
                lunch: lOptions[Math.floor(Math.random() * lOptions.length)],
                dinner: dOptions[Math.floor(Math.random() * dOptions.length)],
                dailyTotal: Math.round(tdee)
            };
        });

        res.status(200).json({ plan: weeklyPlan });
    } catch (error) {
        console.error("Plan Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};