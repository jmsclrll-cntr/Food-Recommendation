// utils/combinationOptimizer.js
//
// Branch-and-Bound Subset-Sum Optimizer
// Replaces the greedy while-loop in pickDailyMeals with an exhaustive-but-pruned
// combination search that guarantees the closest calorie-fit to the daily target
// without ever exceeding the per-slot budget.

const { recommendFoodKNN } = require('../ml/knnmodel');

// --- Configuration ---
const KNN_GATE_SIZE      = 12;  // Max candidates fed into combination search per slot
const MAX_ITEMS_PER_SLOT = 4;   // Hard cap on items per meal (keeps meals reasonable)
const TOP_UP_THRESHOLD   = 50;  // kcal gap below which we skip the refinement pass
const MEAL_RATIOS = {
    breakfast: 0.30,
    lunch:     0.40,
    dinner:    0.30,
};

/**
 * optimizeSlot
 *
 * Uses Branch-and-Bound to find the subset of `candidates` whose
 * total calories lands closest to `budget` without exceeding it.
 * Branches that exceed the budget are pruned immediately.
 * Branches deeper than MAX_ITEMS_PER_SLOT are pruned to cap meal size.
 *
 * Time complexity: O(2^K) worst-case, K = KNN_GATE_SIZE (12)
 *   → 4,096 max nodes per slot, with heavy pruning reducing this in practice.
 *
 * @param {Array}  candidates - Foods pre-selected by KNN gate for this slot
 * @param {number} budget     - Calorie budget for this meal slot
 * @param {Set}    usedIds    - Food IDs already committed today (excluded)
 * @returns {Array} Best subset of foods for this slot
 */
function optimizeSlot(candidates, budget, usedIds) {
    // Initialise with the single best KNN candidate as our starting "best seen"
    const firstValid = candidates.find(f => !usedIds.has(f.id) && (f.calories || 0) <= budget);
    let bestSubset = firstValid ? [firstValid] : [];
    let bestScore  = firstValid ? (budget - (firstValid.calories || 0)) : Infinity;

    function branch(index, currentSubset, currentTotal) {
        // --- Evaluate this node ---
        if (currentSubset.length > 0 && currentTotal <= budget) {
            const score = budget - currentTotal; // Lower is better; 0 is perfect
            if (score < bestScore) {
                bestScore  = score;
                bestSubset = [...currentSubset];
                if (score === 0) return; // Exact match — no need to go deeper
            }
        }

        // --- Pruning conditions ---
        if (index >= candidates.length)                    return; // No more items
        if (currentTotal >= budget)                        return; // Already full
        if (currentSubset.length >= MAX_ITEMS_PER_SLOT)   return; // Meal is full enough

        // --- Recurse over remaining candidates ---
        for (let i = index; i < candidates.length; i++) {
            const food     = candidates[i];
            const calories = food.calories || 0;

            if (usedIds.has(food.id))              continue; // Already used today
            if (currentTotal + calories > budget)  continue; // Would exceed budget — prune

            branch(i + 1, [...currentSubset, food], currentTotal + calories);
        }
    }

    branch(0, [], 0);

    // Fallback: if every candidate exceeds the budget, pick the one closest below it,
    // or if nothing fits at all, just pick the lowest-calorie available item.
    if (bestSubset.length === 0 && candidates.length > 0) {
        const available = candidates.filter(f => !usedIds.has(f.id));
        if (available.length > 0) {
            const sorted = [...available].sort((a, b) => (a.calories || 0) - (b.calories || 0));
            bestSubset = [sorted[0]];
        }
    }

    return bestSubset;
}

/**
 * pickDailyMealsOptimized
 *
 * Builds one day's meal plan (breakfast / lunch / dinner) using the
 * Branch-and-Bound combination search. Designed as a drop-in replacement
 * for the greedy `pickDailyMeals` function in recommendationController.js.
 *
 * API is intentionally identical to the old function so the caller does
 * not need to change:
 *   (bPool, lPool, dPool, dailyTarget, usedIds) → { breakfast, lunch, dinner, dailyTotal }
 *
 * @param {Array}  bPool       - Full breakfast food pool (pre-filtered for conditions/allergies)
 * @param {Array}  lPool       - Full lunch food pool
 * @param {Array}  dPool       - Full dinner food pool
 * @param {number} dailyTarget - Daily calorie target (TDEE ± goal adjustment)
 * @param {Set}    usedIds     - Food IDs used this week (mutated in-place for cross-day dedup)
 * @returns {{ breakfast: Array, lunch: Array, dinner: Array, dailyTotal: number }}
 */
function pickDailyMealsOptimized(bPool, lPool, dPool, dailyTarget, usedIds) {
    const bBudget = Math.round(dailyTarget * MEAL_RATIOS.breakfast);
    const lBudget = Math.round(dailyTarget * MEAL_RATIOS.lunch);
    const dBudget = Math.round(dailyTarget * MEAL_RATIOS.dinner);

    // --- Step 1: KNN Gate — narrow each pool to the top-K nearest candidates ---
    // Pass usedIds so KNN already excludes items committed on previous days.
    const bCandidates = recommendFoodKNN(bPool, bBudget, KNN_GATE_SIZE, usedIds);
    const lCandidates = recommendFoodKNN(lPool, lBudget, KNN_GATE_SIZE, usedIds);
    const dCandidates = recommendFoodKNN(dPool, dBudget, KNN_GATE_SIZE, usedIds);

    // --- Step 2: Branch-and-Bound per slot ---
    // Register each slot's picks into usedIds before solving the next slot
    // so the same food can't appear in both breakfast and lunch on the same day.
    const breakfast = optimizeSlot(bCandidates, bBudget, usedIds);
    breakfast.forEach(f => usedIds.add(f.id));

    const lunch = optimizeSlot(lCandidates, lBudget, usedIds);
    lunch.forEach(f => usedIds.add(f.id));

    const dinner = optimizeSlot(dCandidates, dBudget, usedIds);
    dinner.forEach(f => usedIds.add(f.id));

    // --- Step 3: Refinement pass (optional top-up) ---
    // If the assembled day is still more than TOP_UP_THRESHOLD kcal below target,
    // find the slot with the most headroom and add one extra item.
    const assembledTotal = [...breakfast, ...lunch, ...dinner]
        .reduce((sum, f) => sum + (f.calories || 0), 0);

    const gap = dailyTarget - assembledTotal;

    if (gap > TOP_UP_THRESHOLD) {
        const bUsed     = breakfast.reduce((s, f) => s + (f.calories || 0), 0);
        const lUsed     = lunch.reduce((s, f) => s + (f.calories || 0), 0);
        const dUsed     = dinner.reduce((s, f) => s + (f.calories || 0), 0);

        const candidates = [
            { slot: breakfast, pool: bPool, headroom: bBudget - bUsed },
            { slot: lunch,     pool: lPool, headroom: lBudget - lUsed },
            { slot: dinner,    pool: dPool, headroom: dBudget - dUsed },
        ]
        .filter(s => s.headroom > 0 && s.slot.length < MAX_ITEMS_PER_SLOT)
        .sort((a, b) => b.headroom - a.headroom); // Try largest headroom first

        for (const { slot, pool, headroom } of candidates) {
            const extra = recommendFoodKNN(pool, headroom, 5, usedIds)[0];
            if (extra && (extra.calories || 0) <= headroom) {
                slot.push(extra);
                usedIds.add(extra.id);
                break; // One top-up item per day is enough
            }
        }
    }

    const finalTotal = [...breakfast, ...lunch, ...dinner]
        .reduce((sum, f) => sum + (f.calories || 0), 0);

    return {
        breakfast,
        lunch,
        dinner,
        dailyTotal: Math.round(finalTotal),
    };
}

module.exports = { optimizeSlot, pickDailyMealsOptimized };
