const { findMostFrequentGoal, getFoodDatabase } = require('../ml/mlDataService');
const { predictDietType, applyDietTypeFilter } = require('../ml/dietPredictor');
const { recommendFoodKNN } = require('../ml/knnmodel');
const { extractUniqueIngredients, sequentialSearch } = require('../utils/searchAlgorithms');
const { calculateBmr, calculateTdee, calculateTargetCalories } = require('../ml/utils');
const { pickWeeklyMealsOptimized, acceptableGap } = require('../utils/combinationOptimizer');

let cachedIngredients = null;

const getOrCacheIngredients = async () => {
    if (cachedIngredients) return cachedIngredients;
    const foodPool = await getFoodDatabase('none');
    cachedIngredients = extractUniqueIngredients(foodPool);
    return cachedIngredients;
};

const filterAllergens = (foodPool, allergies) => {
    if (!allergies || allergies.length === 0) return foodPool;

    return foodPool.filter(f => {
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
};

const mealCalorieHint = (dailyTarget, mealType) => {
    const ratios = { breakfast: 0.30, lunch: 0.40, dinner: 0.30 };
    return Math.round(dailyTarget * (ratios[mealType?.toLowerCase()] || 0.33));
};

exports.getAllIngredients = async (req, res) => {
    try {
        const ingredients = await getOrCacheIngredients();
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllFoods = async (req, res) => {
    try {
        const foods = await getFoodDatabase([]);
        res.status(200).json(foods);
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

/**
 * Goal suggestion: community frequency (health_logs memory).
 * Diet type: Decision Tree (ml/data.js + decisionTreeModel.js).
 */
exports.getSuggestion = (req, res) => {
    try {
        const { gender, bmi, weight, height, goal, conditions, condition } = req.query;
        let condArray = [];
        if (conditions) {
            try {
                condArray = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
            } catch (e) {
                condArray = [conditions];
            }
        } else if (condition) {
            condArray = [condition];
        }

        const community = findMostFrequentGoal(gender, parseFloat(bmi));
        const activeGoal = goal || community.goal || 'maintain';

        const diet = predictDietType(
            parseFloat(weight),
            parseFloat(height),
            activeGoal,
            condArray
        );

        res.status(200).json({
            goal: community.goal,
            category: community.category,
            peerCount: community.peerCount,
            dietType: diet.key,
            dietLabel: diet.label,
            dietLabelTagalog: diet.tagalog,
            ml: {
                goalEngine: 'community_frequency',
                dietEngine: 'decision_tree',
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAlternatives = async (req, res) => {
    try {
        const { type, targetCalories } = req.query;
        let condArray = [];
        if (req.query.conditions) {
            try { condArray = JSON.parse(req.query.conditions); } catch (e) { condArray = [req.query.conditions]; }
        } else if (req.query.condition) {
            condArray = [req.query.condition];
        }
        const allergies = req.query.allergies ? JSON.parse(req.query.allergies) : [];

        let foodPool = await getFoodDatabase(condArray);
        foodPool = filterAllergens(foodPool, allergies);

        const diet = predictDietType(
            parseFloat(req.query.weight) || 160,
            parseFloat(req.query.height) || 65,
            req.query.goal || 'maintain',
            condArray
        );
        foodPool = applyDietTypeFilter(foodPool, diet.code);

        let filtered = foodPool.filter(f => f.type?.toLowerCase() === type?.toLowerCase());

        const calTarget = parseFloat(targetCalories) || mealCalorieHint(2000, type);
        filtered = recommendFoodKNN(filtered, calTarget, 30);

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
        const tdee = calculateTdee(weight, height, age, gender, activeActivity);
        const dailyTargetCalories = calculateTargetCalories(0, gender, goal, weight, height, age, activeActivity);

        const diet = predictDietType(weight, height, goal, condArray);

        let foodPool = await getFoodDatabase(condArray);
        foodPool = applyDietTypeFilter(foodPool, diet.code);
        foodPool = filterAllergens(foodPool, allergies);

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const bPool = foodPool.filter(f => f.type?.toLowerCase() === 'breakfast');
        const lPool = foodPool.filter(f => f.type?.toLowerCase() === 'lunch');
        const dPool = foodPool.filter(f => f.type?.toLowerCase() === 'dinner');

        const dayResults = pickWeeklyMealsOptimized(bPool, lPool, dPool, dailyTargetCalories, days.length);
        const weeklyPlan = {};
        const tolerance = acceptableGap(dailyTargetCalories);

        days.forEach((day, i) => {
            const gap = Math.max(0, Math.round(dailyTargetCalories) - dayResults[i].dailyTotal);
            weeklyPlan[day] = {
                ...dayResults[i],
                calorieGap: gap,
                onTarget: gap <= tolerance,
            };
        });

        const poolSize = { breakfast: bPool.length, lunch: lPool.length, dinner: dPool.length };

        res.status(200).json({
            plan: weeklyPlan,
            dailyTarget: Math.round(dailyTargetCalories),
            calorieTolerance: tolerance,
            nutritionTargets: {
                bmr,
                tdee,
                dailyTarget: Math.round(dailyTargetCalories),
                tolerance,
            },
            dietRecommendation: {
                type: diet.key,
                label: diet.label,
                tagalog: diet.tagalog,
            },
            foodPoolSize: poolSize,
            ml: {
                dietEngine: 'decision_tree',
                mealEngine: 'knn_plus_calorie_optimizer',
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
