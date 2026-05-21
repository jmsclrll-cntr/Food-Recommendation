// utils/combinationOptimizer.js
//
// Priority: every day within tolerance of dailyTarget (consistent calories).
// Secondary: no duplicate food IDs within the same week when pool allows.

const { recommendFoodKNN } = require('../ml/knnmodel');

const MAX_ITEMS_PER_SLOT = 6;
const KNN_CANDIDATES = 24;
const SLOT_SEARCH_ITEMS = 28;
const GAP_FILL_MAX_PASSES = 60;

const MEAL_RATIOS = { breakfast: 0.30, lunch: 0.40, dinner: 0.30 };
const RATIO_VARIANTS = [
    MEAL_RATIOS,
    { breakfast: 0.25, lunch: 0.45, dinner: 0.30 },
    { breakfast: 0.35, lunch: 0.35, dinner: 0.30 },
    { breakfast: 0.30, lunch: 0.35, dinner: 0.35 },
    { breakfast: 0.20, lunch: 0.50, dinner: 0.30 },
    { breakfast: 0.28, lunch: 0.42, dinner: 0.30 },
];

const knnCache = new Map();

function acceptableGap(dailyTarget) {
    return Math.max(20, Math.round(dailyTarget * 0.02));
}

function validFoods(pool) {
    return pool.filter(f => f.id && (f.grams || 0) > 0 && (f.calories || 0) > 0);
}

function cacheKey(pool, budget) {
    const ids = pool.length <= 50
        ? pool.map(f => f.id).join(',')
        : `len:${pool.length}`;
    return `${ids}|${budget}`;
}

function rotateList(arr, offset) {
    if (!arr.length) return arr;
    const o = offset % arr.length;
    return o === 0 ? arr : [...arr.slice(o), ...arr.slice(0, o)];
}

function poolForWeek(pool, weeklyUsedIds, allowRepeatForCalories) {
    const base = validFoods(pool);
    if (allowRepeatForCalories) return base;
    return base.filter(f => !weeklyUsedIds.has(f.id));
}

function expandCandidates(pool, mealBudget, dayUsedIds, weeklyUsedIds, dayIndex, allowRepeat) {
    const base = poolForWeek(pool, weeklyUsedIds, allowRepeat);
    if (base.length === 0) return [];

    const key = cacheKey(base, mealBudget);
    let ranked = knnCache.get(key);
    if (!ranked) {
        ranked = recommendFoodKNN(base, mealBudget, KNN_CANDIDATES, new Set());
        knnCache.set(key, ranked);
    }

    const seen = new Set();
    const out = [];

    const add = (list) => list.forEach(f => {
        if (!f.id || dayUsedIds.has(f.id) || seen.has(f.id)) return;
        if (!allowRepeat && weeklyUsedIds.has(f.id)) return;
        seen.add(f.id);
        out.push(f);
    });

    add(rotateList(ranked, dayIndex));
    add([...base]
        .filter(f => (f.calories || 0) <= mealBudget)
        .sort((a, b) => (b.calories || 0) - (a.calories || 0))
        .slice(0, 12));
    add([...base]
        .sort((a, b) => Math.abs((a.calories || 0) - mealBudget) - Math.abs((b.calories || 0) - mealBudget))
        .slice(0, 10));

    return out.slice(0, SLOT_SEARCH_ITEMS);
}

function clearPlannerCache() {
    knnCache.clear();
}

function dayTotalFromMeals(breakfast, lunch, dinner) {
    const sum = (arr) => arr.reduce((s, f) => s + (f.calories || 0), 0);
    return sum(breakfast) + sum(lunch) + sum(dinner);
}

function daySignature(day) {
    return [...day.breakfast, ...day.lunch, ...day.dinner]
        .map(f => f.id)
        .sort()
        .join('|');
}

function collectDayUsedIds(day) {
    const ids = new Set();
    [...day.breakfast, ...day.lunch, ...day.dinner].forEach(f => {
        if (f.id) ids.add(f.id);
    });
    return ids;
}

/**
 * Subset closest to meal budget (minimize |budget - total|), never over budget.
 */
function optimizeMealSlot(pool, budget, dayUsedIds, weeklyUsedIds, dayIndex, allowRepeat) {
    const items = expandCandidates(pool, budget, dayUsedIds, weeklyUsedIds, dayIndex, allowRepeat);
    if (items.length === 0) return [];

    let best = [];
    let bestGap = Infinity;

    function search(start, pick, total) {
        const gap = budget - total;
        if (pick.length > 0 && gap >= 0 && gap < bestGap) {
            bestGap = gap;
            best = [...pick];
            if (gap === 0) return;
        }
        if (pick.length >= MAX_ITEMS_PER_SLOT || start >= items.length) return;

        for (let i = start; i < items.length; i++) {
            const cal = items[i].calories || 0;
            if (total + cal > budget) continue;
            pick.push(items[i]);
            search(i + 1, pick, total + cal);
            pick.pop();
        }
    }

    search(0, [], 0);

    if (best.length === 0) {
        const single = items
            .filter(f => (f.calories || 0) <= budget)
            .sort((a, b) => Math.abs(budget - (a.calories || 0)) - Math.abs(budget - (b.calories || 0)))[0];
        if (single) best = [single];
    }

    best.forEach(f => dayUsedIds.add(f.id));
    return best;
}

function gapFillToTarget(meals, pools, dailyTarget, dayUsedIds, weeklyUsedIds, dayIndex, allowRepeat) {
    const tol = acceptableGap(dailyTarget);
    const slots = [
        { meal: meals.breakfast, pool: pools.b, type: 'breakfast' },
        { meal: meals.lunch, pool: pools.l, type: 'lunch' },
        { meal: meals.dinner, pool: pools.d, type: 'dinner' },
    ];

    for (let pass = 0; pass < GAP_FILL_MAX_PASSES; pass++) {
        const currentTotal = dayTotalFromMeals(meals.breakfast, meals.lunch, meals.dinner);
        const gap = dailyTarget - currentTotal;
        if (gap <= tol) break;

        let bestPick = null;
        let bestSlot = null;
        let bestNewGap = Infinity;

        for (const slot of slots) {
            if (slot.meal.length >= MAX_ITEMS_PER_SLOT) continue;

            let candidates = expandCandidates(slot.pool, gap, dayUsedIds, weeklyUsedIds, dayIndex + pass, allowRepeat);
            if (candidates.length === 0) {
                candidates = poolForWeek(slot.pool, weeklyUsedIds, allowRepeat)
                    .filter(f => !dayUsedIds.has(f.id) && (f.calories || 0) > 0 && (f.calories || 0) <= gap)
                    .sort((a, b) => Math.abs(gap - (a.calories || 0)) - Math.abs(gap - (b.calories || 0)))
                    .slice(0, 15);
            }

            for (const f of candidates) {
                const cal = f.calories || 0;
                if (cal <= 0 || cal > gap) continue;

                const newGap = dailyTarget - (currentTotal + cal);
                if (newGap >= 0 && newGap < bestNewGap) {
                    bestNewGap = newGap;
                    bestPick = f;
                    bestSlot = slot;
                }
            }
        }

        if (!bestPick || !bestSlot) break;

        bestSlot.meal.push(bestPick);
        dayUsedIds.add(bestPick.id);
    }
}

function repairDayToTarget(day, pools, dailyTarget, weeklyUsedIds, dayIndex) {
    const dayUsedIds = collectDayUsedIds(day);
    const meals = {
        breakfast: day.breakfast,
        lunch: day.lunch,
        dinner: day.dinner,
    };
    const tol = acceptableGap(dailyTarget);

    gapFillToTarget(meals, pools, dailyTarget, dayUsedIds, weeklyUsedIds, dayIndex + 100, false);

    let total = dayTotalFromMeals(meals.breakfast, meals.lunch, meals.dinner);
    if (dailyTarget - total > tol) {
        gapFillToTarget(meals, pools, dailyTarget, dayUsedIds, weeklyUsedIds, dayIndex + 200, true);
        total = dayTotalFromMeals(meals.breakfast, meals.lunch, meals.dinner);
    }

    day.breakfast = meals.breakfast;
    day.lunch = meals.lunch;
    day.dinner = meals.dinner;
    day.dailyTotal = Math.round(total);
    day.gap = Math.max(0, dailyTarget - total);
    return day;
}

function buildDayForRatios(bPool, lPool, dPool, dailyTarget, weeklyUsedIds, dayIndex, ratios, allowRepeat) {
    const bBudget = Math.round(dailyTarget * ratios.breakfast);
    const lBudget = Math.round(dailyTarget * ratios.lunch);
    const dBudget = dailyTarget - bBudget - lBudget;
    const dayUsedIds = new Set();

    const breakfast = optimizeMealSlot(bPool, bBudget, dayUsedIds, weeklyUsedIds, dayIndex, allowRepeat);
    const lunch = optimizeMealSlot(lPool, lBudget, dayUsedIds, weeklyUsedIds, dayIndex + 1, allowRepeat);
    const dinner = optimizeMealSlot(dPool, dBudget, dayUsedIds, weeklyUsedIds, dayIndex + 2, allowRepeat);

    const day = {
        breakfast,
        lunch,
        dinner,
        dailyTotal: 0,
        gap: dailyTarget,
    };

    return repairDayToTarget(day, { b: bPool, l: lPool, d: dPool }, dailyTarget, weeklyUsedIds, dayIndex);
}

function buildBestDay(bPool, lPool, dPool, dailyTarget, weeklyUsedIds, dayIndex) {
    const tol = acceptableGap(dailyTarget);
    let best = null;

    for (let r = 0; r < RATIO_VARIANTS.length; r++) {
        let attempt = buildDayForRatios(
            bPool, lPool, dPool, dailyTarget, weeklyUsedIds, dayIndex + r * 7, RATIO_VARIANTS[r], false
        );

        if (attempt.gap > tol) {
            attempt = buildDayForRatios(
                bPool, lPool, dPool, dailyTarget, weeklyUsedIds, dayIndex + r * 7 + 50, RATIO_VARIANTS[r], true
            );
        }

        if (!best || attempt.gap < best.gap || (attempt.gap === best.gap && attempt.dailyTotal > best.dailyTotal)) {
            best = attempt;
        }
        if (attempt.gap <= tol) break;
    }

    return repairDayToTarget(best, { b: bPool, l: lPool, d: dPool }, dailyTarget, weeklyUsedIds, dayIndex + 300);
}

function trackDayFoods(day, weeklyUsedIds) {
    [...day.breakfast, ...day.lunch, ...day.dinner].forEach(f => {
        if (f.id) weeklyUsedIds.add(f.id);
    });
}

function pickDailyMealsOptimized(bPool, lPool, dPool, dailyTarget) {
    clearPlannerCache();
    const day = buildBestDay(bPool, lPool, dPool, dailyTarget, new Set(), 0);
    return {
        breakfast: day.breakfast,
        lunch: day.lunch,
        dinner: day.dinner,
        dailyTotal: day.dailyTotal,
    };
}

function pickWeeklyMealsOptimized(bPool, lPool, dPool, dailyTarget, dayCount = 7) {
    clearPlannerCache();

    const weeklyUsedIds = new Set();
    const usedSignatures = new Set();
    const days = [];
    const tol = acceptableGap(dailyTarget);

    for (let i = 0; i < dayCount; i++) {
        let chosen = null;
        let chosenSig = '';

        for (let attempt = 0; attempt < 10; attempt++) {
            const candidate = buildBestDay(
                bPool, lPool, dPool, dailyTarget, weeklyUsedIds, i * 19 + attempt * 31
            );
            const sig = daySignature(candidate);

            const isOnTarget = candidate.gap <= tol;
            const isUnique = !usedSignatures.has(sig);

            if (isOnTarget && isUnique) {
                chosen = candidate;
                chosenSig = sig;
                break;
            }

            if (!chosen) {
                chosen = candidate;
                chosenSig = sig;
                continue;
            }

            const betterGap = candidate.gap < chosen.gap;
            const betterUnique = isUnique && !usedSignatures.has(chosenSig);
            if (betterGap || (candidate.gap === chosen.gap && betterUnique)) {
                chosen = candidate;
                chosenSig = sig;
            }
        }

        usedSignatures.add(chosenSig);
        trackDayFoods(chosen, weeklyUsedIds);

        days.push({
            breakfast: chosen.breakfast,
            lunch: chosen.lunch,
            dinner: chosen.dinner,
            dailyTotal: chosen.dailyTotal,
        });
    }

    return days;
}

function optimizeSlot(eligible, budget, dayUsedIds) {
    return optimizeMealSlot(eligible, budget, dayUsedIds, new Set(), 0, false);
}

module.exports = {
    optimizeSlot,
    pickDailyMealsOptimized,
    pickWeeklyMealsOptimized,
    clearPlannerCache,
    acceptableGap,
};
