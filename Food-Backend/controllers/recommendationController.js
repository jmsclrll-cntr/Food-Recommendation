const { findMostFrequentGoal, getFoodDatabase } = require('../ml/mlDataService');
const { recommendFoodKNN } = require('../ml/knnmodel');
const { extractUniqueIngredients, sequentialSearch } = require('../utils/searchAlgorithms');
const { calculateBmr, calculateTdee, calculateTargetCalories } = require('../ml/utils');
const { pickDailyMealsOptimized } = require('../utils/combinationOptimizer');

let cachedIngredients = null;

const getOrCacheIngredients = async () => {
    if (cachedIngredients) return cachedIngredients;
    const foodPool = await getFoodDatabase('none');
    cachedIngredients = extractUniqueIngredients(foodPool);
    return cachedIngredients;
};

exports.getAllIngredients = async (req, res) => {
    try {
        const ingredients = await getOrCacheIngredients();
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchIngredients = async (req, res) => {
    try {
        const query = req.query.q || '';
        const list = await getOrCacheIngredients();
        const matched = sequentialSearch(list, query);
        res.status(200).json(matched);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSuggestion = (req, res) => {
    try {
        const { gender, bmi } = req.query;
        const result = findMostFrequentGoal(gender, parseFloat(bmi));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAlternatives = async (req, res) => {
    try {
        const { type } = req.query;
        let condArray = [];
        if (req.query.conditions) {
            try { condArray = JSON.parse(req.query.conditions); } catch(e) { condArray = [req.query.conditions]; }
        } else if (req.query.condition) {
            condArray = [req.query.condition];
        }
        const allergies = req.query.allergies ? JSON.parse(req.query.allergies) : [];
        let foodPool = await getFoodDatabase(condArray);

        // Exclude allergen items
        if (allergies && allergies.length > 0) {
            foodPool = foodPool.filter(f => {
                if (!f.ingredients) return true;
                let ingList = [];
                if (Array.isArray(f.ingredients)) {
                    ingList = f.ingredients;
                } else if (typeof f.ingredients === 'string') {
                    const trimmed = f.ingredients.trim();
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        try {
                            ingList = JSON.parse(trimmed);
                        } catch (e) {
                            ingList = f.ingredients.split(',').map(x => x.trim().toLowerCase());
                        }
                    } else {
                        ingList = f.ingredients.split(',').map(x => x.trim().toLowerCase());
                    }
                }
                return !ingList.some(ing => {
                    const cleanIng = ing.toLowerCase().trim();
                    return allergies.some(allergy => {
                        const cleanAllergy = allergy.toLowerCase().trim();
                        return cleanIng.includes(cleanAllergy) || cleanAllergy.includes(cleanIng);
                    });
                });
            });
        }

        const filtered = foodPool.filter(f => f.type?.toLowerCase() === type?.toLowerCase());
        res.status(200).json(filtered);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWeeklySuggestion = async (req, res) => {
    try {
        const weight = parseFloat(req.body.weight);
        const height = parseFloat(req.body.height);
        const age = parseFloat(req.body.age || 25);
        const { gender, goal, conditions, condition, activity } = req.body;
        const allergies = req.body.allergies || [];
        const condArray = conditions || (condition ? [condition] : []);

        const activeActivity = activity || 'moderate';
        const bmr = calculateBmr(weight, height, age, gender);
        const tdee = calculateTargetCalories(0, gender, goal, weight, height, age, activeActivity);

        let foodPool = await getFoodDatabase(condArray);

        // Exclude allergen items from KNN pool
        if (allergies && allergies.length > 0) {
            foodPool = foodPool.filter(f => {
                if (!f.ingredients) return true;
                let ingList = [];
                if (Array.isArray(f.ingredients)) {
                    ingList = f.ingredients;
                } else if (typeof f.ingredients === 'string') {
                    const trimmed = f.ingredients.trim();
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        try {
                            ingList = JSON.parse(trimmed);
                        } catch (e) {
                            ingList = f.ingredients.split(',').map(x => x.trim().toLowerCase());
                        }
                    } else {
                        ingList = f.ingredients.split(',').map(x => x.trim().toLowerCase());
                    }
                }
                return !ingList.some(ing => {
                    const cleanIng = ing.toLowerCase().trim();
                    return allergies.some(allergy => {
                        const cleanAllergy = allergy.toLowerCase().trim();
                        return cleanIng.includes(cleanAllergy) || cleanAllergy.includes(cleanIng);
                    });
                });
            });
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let weeklyPlan = {};
        let usedFoodIds = new Set(); // Track every individual food used across the entire week

        // Pre-filter pools once to save time
        const bPool = foodPool.filter(f => f.type?.toLowerCase() === 'breakfast');
        const lPool = foodPool.filter(f => f.type?.toLowerCase() === 'lunch');
        const dPool = foodPool.filter(f => f.type?.toLowerCase() === 'dinner');

        days.forEach((day) => {
            const result = pickDailyMealsOptimized(bPool, lPool, dPool, tdee, usedFoodIds);
            weeklyPlan[day] = result;
        });

        res.status(200).json({ plan: weeklyPlan, dailyTarget: Math.round(tdee) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};