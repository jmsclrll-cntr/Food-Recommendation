const classifier = require('./decisionTreeModel');

const DIET_BY_CODE = {
    0: { key: 'low_carb', label: 'Low Carb Diet', tagalog: 'Diet na mababa ang carbs' },
    1: { key: 'high_protein', label: 'High Protein Diet', tagalog: 'Diet na mataas ang protina' },
    2: { key: 'low_sugar', label: 'Low Sugar Diet', tagalog: 'Diet na mababa ang asukal' },
    3: { key: 'low_sodium', label: 'Low Sodium Diet', tagalog: 'Diet na mababa ang sodium' },
};

function normalizeGoal(goal) {
    const g = (goal || '').toLowerCase();
    if (g.includes('lose') || g.includes('loss')) return 0;
    if (g.includes('gain') || g.includes('build')) return 1;
    return 2;
}

function primaryConditionCode(conditions) {
    const arr = Array.isArray(conditions)
        ? conditions.map(c => c.toLowerCase())
        : conditions
            ? [String(conditions).toLowerCase()]
            : [];

    if (arr.includes('heart disease')) return 3;
    if (arr.includes('hypertension')) return 2;
    if (arr.includes('diabetes')) return 1;
    return 0;
}

/**
 * Decision Tree input: [weight, height, targetGoal, conditionCode]
 * @see ml/data.js
 */
function predictDietType(weight, height, goal, conditions) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const features = [[
        Number.isFinite(w) && w > 0 ? w : 160,
        Number.isFinite(h) && h > 0 ? h : 65,
        normalizeGoal(goal),
        primaryConditionCode(conditions),
    ]];

    const code = classifier.predict(features)[0];
    const meta = DIET_BY_CODE[code] || DIET_BY_CODE[1];

    return {
        code,
        key: meta.key,
        label: meta.label,
        tagalog: meta.tagalog,
    };
}

function dietMatchScore(food, dietCode) {
    if (dietCode === 0) {
        const carbs = food.carbs ?? food.carbohydrates ?? 50;
        return carbs <= 45 ? 2 : carbs <= 60 ? 1 : 0;
    }
    if (dietCode === 1) {
        const protein = food.protein || 0;
        return protein >= 15 ? 2 : protein >= 10 ? 1 : 0;
    }
    if (dietCode === 2) {
        const sugar = food.sugar || 0;
        return sugar <= 5 ? 2 : sugar <= 10 ? 1 : 0;
    }
    if (dietCode === 3) {
        const sodium = food.sodium || 0;
        return sodium <= 400 ? 2 : sodium <= 600 ? 1 : 0;
    }
    return 1;
}

/**
 * Soft filter: prefer Decision Tree matches but keep pool large enough to hit calorie targets.
 */
function applyDietTypeFilter(foods, dietCode) {
    if (!foods || foods.length === 0) return foods;

    const scored = foods
        .map(f => ({ food: f, score: dietMatchScore(f, dietCode) }))
        .sort((a, b) => b.score - a.score);

    const strong = scored.filter(x => x.score >= 2).map(x => x.food);
    const ok = scored.filter(x => x.score >= 1).map(x => x.food);

    if (strong.length >= 12) return strong;
    if (ok.length >= 8) return ok;
    return foods;
}

module.exports = {
    predictDietType,
    applyDietTypeFilter,
    DIET_BY_CODE,
};
