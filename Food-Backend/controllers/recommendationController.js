const { findMostFrequentGoal, getFoodDatabase } = require('../ml/mlDataService');
const { recommendFoodKNN } = require('../ml/knnmodel');
const { extractUniqueIngredients, sequentialSearch } = require('../utils/searchAlgorithms');
const { calculateBmr, calculateTdee, calculateTargetCalories } = require('../ml/utils');

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
        const { type, condition } = req.query;
        const allergies = req.query.allergies ? JSON.parse(req.query.allergies) : [];
        let foodPool = await getFoodDatabase(condition);

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
        const { gender, goal, condition, activity } = req.body;
        const allergies = req.body.allergies || [];

        const activeActivity = activity || 'moderate';
        const bmr = calculateBmr(weight, height, age, gender);
        const tdee = calculateTargetCalories(0, gender, goal, weight, height, age, activeActivity);

        let foodPool = await getFoodDatabase(condition);

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

        days.forEach((day, dayIndex) => {

            // Bias jitter significantly downwards (range: 85% to 95%) 
            // This ensures main meals are always under the goal, leaving room for supplements.
            const jitter = 0.85 + (Math.random() * 0.1);
            const dayTdee = tdee * jitter;

            // Pick main meals using KNN with exclusion + wider K for more options
            const lTarget = dayTdee * (0.40 + Math.random() * 0.10);
            const lCandidates = recommendFoodKNN(lPool, lTarget, 15, usedFoodIds);
            const lunch = lCandidates[0] || recommendFoodKNN(lPool, lTarget, 15)[0];

            const remaining = dayTdee - (lunch?.calories || 0);
            const bRatio = 0.40 + (Math.random() * 0.20);
            const bTarget = remaining * bRatio;
            const dTarget = remaining * (1 - bRatio);

            const bCandidates = recommendFoodKNN(bPool, bTarget, 15, usedFoodIds);
            const breakfast = bCandidates[0] || recommendFoodKNN(bPool, bTarget, 15)[0];

            const dCandidates = recommendFoodKNN(dPool, dTarget, 15, usedFoodIds);
            const dinner = dCandidates[0] || recommendFoodKNN(dPool, dTarget, 15)[0];

            let bItems = breakfast ? [breakfast] : [];
            let lItems = lunch ? [lunch] : [];
            let dItems = dinner ? [dinner] : [];

            let currentTotal = (breakfast?.calories || 0) + (lunch?.calories || 0) + (dinner?.calories || 0);
            let deficit = tdee - currentTotal;

            // Fill deficit with supplements until within 50 kcal of target
            // STRATEGY: Always stay UNDER the target. Only add if food.calories <= deficit.
            while (deficit > 10) { 
                const currentDayIds = new Set([...bItems, ...lItems, ...dItems].map(i => i.id).filter(Boolean));
                const tempUsed = new Set([...usedFoodIds, ...currentDayIds]);
                
                // 1. Filter for foods that actually FIT in the remaining deficit
                let candidates = foodPool.filter(f => f.calories > 0 && f.calories <= deficit);
                
                if (candidates.length === 0) break; // No foods small enough to fit

                // 2. Try to find a UNIQUE one from the fitting candidates
                let uniqueCandidates = candidates.filter(f => !tempUsed.has(f.id));
                let poolToUse = uniqueCandidates.length > 0 ? uniqueCandidates : candidates;

                // 3. Pick the largest food that still fits
                poolToUse.sort((a, b) => b.calories - a.calories); 
                let supplement = poolToUse[0];
                
                if (!supplement) break;

                const type = supplement.type?.toLowerCase();
                if (type === 'breakfast') bItems.push(supplement);
                else if (type === 'lunch') lItems.push(supplement);
                else dItems.push(supplement);

                currentTotal += supplement.calories || 0;
                deficit = tdee - currentTotal;
            }

            // Mark all selected foods as used globally
            [...bItems, ...lItems, ...dItems].forEach(item => {
                if (item?.id) usedFoodIds.add(item.id);
            });


            weeklyPlan[day] = {
                breakfast: bItems,
                lunch: lItems,
                dinner: dItems,
                dailyTotal: Math.round(currentTotal)
            };
        });

        res.status(200).json({ plan: weeklyPlan, dailyTarget: Math.round(tdee) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};