// utils/combinationOptimizer.js
//
// Priority: daily total as close as possible to dailyTarget.
// Repeating the same meal across days is allowed.
// Same food never appears twice in one day.

const MAX_ITEMS_PER_SLOT = 6;
const NEAR_TARGET_GAP = 20;
const MAX_POOL_FOR_SEARCH = 22;

const MEAL_RATIOS = { breakfast: 0.30, lunch: 0.40, dinner: 0.30 };

function validFoods(pool) {
    return pool.filter(f => f.id && (f.grams || 0) > 0 && (f.calories || 0) > 0);
}

function dayTotal(slots) {
    return slots.reduce(
        (s, sl) => s + sl.meal.reduce((ss, f) => ss + (f.calories || 0), 0),
        0
    );
}

/** Keep the most useful items for search (diverse calorie sizes). */
function trimPoolForSearch(pool, dailyTarget, mealShare) {
    const items = validFoods(pool);
    if (items.length <= MAX_POOL_FOR_SEARCH) return items;

    const budget = dailyTarget * mealShare;
    const seen = new Set();
    const out = [];

    const add = (list) => list.forEach(f => {
        if (!seen.has(f.id)) { seen.add(f.id); out.push(f); }
    });

    add([...items].sort((a, b) => Math.abs((a.calories || 0) - budget) - Math.abs((b.calories || 0) - budget)).slice(0, 8));
    add([...items].sort((a, b) => (b.calories || 0) - (a.calories || 0)).slice(0, 6));
    add([...items].filter(f => (f.calories || 0) <= 150).sort((a, b) => (b.calories || 0) - (a.calories || 0)).slice(0, 8));

    return out.slice(0, MAX_POOL_FOR_SEARCH);
}

/** All non-empty subsets up to maxItems that fit in maxCal. */
function generateSubsets(pool, maxItems, maxCal, excludeIds) {
    const items = pool.filter(f => !excludeIds.has(f.id));
    const results = [];

    function backtrack(start, pick, total) {
        if (pick.length > 0) results.push({ items: [...pick], total });

        if (pick.length >= maxItems) return;

        for (let i = start; i < items.length; i++) {
            const cal = items[i].calories || 0;
            if (total + cal > maxCal) continue;
            pick.push(items[i]);
            backtrack(i + 1, pick, total + cal);
            pick.pop();
        }
    }

    backtrack(0, [], 0);
    return results;
}

// ── Branch-and-bound for one meal slot ───────────────────────
function optimizeSlot(eligible, budget, dayUsedIds) {
    const pool = eligible.filter(
        f => !dayUsedIds.has(f.id) && (f.calories || 0) > 0 && (f.calories || 0) <= budget
    );
    if (pool.length === 0) return [];

    let best = [];
    let bestGap = Infinity;

    function branch(idx, subset, total) {
        const gap = budget - total;
        if (subset.length > 0 && gap >= 0 && gap < bestGap) {
            bestGap = gap;
            best = [...subset];
            if (gap === 0) return;
        }
        if (idx >= pool.length || total >= budget || subset.length >= MAX_ITEMS_PER_SLOT) return;

        for (let i = idx; i < pool.length; i++) {
            const cal = pool[i].calories || 0;
            if (total + cal > budget) continue;
            branch(i + 1, [...subset, pool[i]], total + cal);
        }
    }

    branch(0, [], 0);

    if (best.length === 0) {
        const fit = [...pool].sort(
            (a, b) => Math.abs(budget - (a.calories || 0)) - Math.abs(budget - (b.calories || 0))
        );
        if (fit.length > 0) best = [fit[0]];
    }

    return best;
}

// ── Exhaustive day search (breakfast × lunch × dinner subsets) ──
function searchNearestDay(bPool, lPool, dPool, dailyTarget) {
    const bItems = trimPoolForSearch(bPool, dailyTarget, MEAL_RATIOS.breakfast);
    const lItems = trimPoolForSearch(lPool, dailyTarget, MEAL_RATIOS.lunch);
    const dItems = trimPoolForSearch(dPool, dailyTarget, MEAL_RATIOS.dinner);

    let best = null;

    const bSubs = generateSubsets(bItems, MAX_ITEMS_PER_SLOT, dailyTarget, new Set())
        .filter(s => s.items.length > 0);

    for (const b of bSubs) {
        const used = new Set(b.items.map(f => f.id));

        const lSubs = generateSubsets(lItems, MAX_ITEMS_PER_SLOT, dailyTarget - b.total, used)
            .filter(s => s.items.length > 0);

        for (const l of lSubs) {
            l.items.forEach(f => used.add(f.id));
            const afterLunch = dailyTarget - b.total - l.total;

            const dSubs = generateSubsets(dItems, MAX_ITEMS_PER_SLOT, afterLunch, used)
                .filter(s => s.items.length > 0);

            for (const d of dSubs) {
                const total = b.total + l.total + d.total;
                const gap = dailyTarget - total;
                if (gap < 0) continue;

                if (!best || gap < best.gap || (gap === best.gap && total > best.dailyTotal)) {
                    best = {
                        breakfast: b.items,
                        lunch: l.items,
                        dinner: d.items,
                        dailyTotal: Math.round(total),
                        gap,
                    };
                }
            }

            l.items.forEach(f => used.delete(f.id));
        }
    }

    return best;
}

// ── Greedy day builder using full pools (no weekly repeat limit) ──
function buildDayGreedy(bPool, lPool, dPool, dailyTarget, ratios) {
    const bBudget = Math.round(dailyTarget * ratios.breakfast);
    const lBudget = Math.round(dailyTarget * ratios.lunch);
    const dBudget = dailyTarget - bBudget - lBudget;
    const dayUsedIds = new Set();

    const breakfast = optimizeSlot(validFoods(bPool), bBudget, dayUsedIds);
    breakfast.forEach(f => dayUsedIds.add(f.id));

    const lunch = optimizeSlot(validFoods(lPool), lBudget, dayUsedIds);
    lunch.forEach(f => dayUsedIds.add(f.id));

    const dinner = optimizeSlot(validFoods(dPool), dBudget, dayUsedIds);
    dinner.forEach(f => dayUsedIds.add(f.id));

    const slots = [
        { meal: breakfast, pool: validFoods(bPool) },
        { meal: lunch, pool: validFoods(lPool) },
        { meal: dinner, pool: validFoods(dPool) },
    ];

    gapFillNearest(slots, dailyTarget, dayUsedIds);

    const total = dayTotal(slots);
    return {
        breakfast: slots[0].meal,
        lunch: slots[1].meal,
        dinner: slots[2].meal,
        dailyTotal: Math.round(total),
        gap: Math.max(0, dailyTarget - total),
    };
}

function gapFillNearest(slots, dailyTarget, dayUsedIds) {
    for (let pass = 0; pass < 50; pass++) {
        const currentTotal = dayTotal(slots);
        const gap = dailyTarget - currentTotal;
        if (gap <= NEAR_TARGET_GAP) break;

        let bestPick = null;
        let bestSlot = null;
        let bestNewGap = Infinity;

        for (const slot of slots) {
            if (slot.meal.length >= MAX_ITEMS_PER_SLOT) continue;

            for (const f of slot.pool) {
                if (!f.id || dayUsedIds.has(f.id)) continue;
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

function pickBestAttempt(attempts, dailyTarget) {
    let best = null;
    for (const a of attempts) {
        if (!a) continue;
        if (!best || a.gap < best.gap || (a.gap === best.gap && a.dailyTotal > best.dailyTotal)) {
            best = a;
        }
    }
    return best;
}

// ── Public API ───────────────────────────────────────────────
function pickDailyMealsOptimized(bPool, lPool, dPool, dailyTarget, _usedFoodIds) {
    const ratioVariants = [
        MEAL_RATIOS,
        { breakfast: 0.25, lunch: 0.45, dinner: 0.30 },
        { breakfast: 0.35, lunch: 0.35, dinner: 0.30 },
        { breakfast: 0.30, lunch: 0.35, dinner: 0.35 },
        { breakfast: 0.20, lunch: 0.50, dinner: 0.30 },
    ];

    const attempts = [];

    const exhaustive = searchNearestDay(bPool, lPool, dPool, dailyTarget);
    if (exhaustive) attempts.push(exhaustive);

    for (const ratios of ratioVariants) {
        attempts.push(buildDayGreedy(bPool, lPool, dPool, dailyTarget, ratios));
    }

    const best = pickBestAttempt(attempts, dailyTarget);

    if (!best) {
        return {
            breakfast: [],
            lunch: [],
            dinner: [],
            dailyTotal: 0,
        };
    }

    return {
        breakfast: best.breakfast,
        lunch: best.lunch,
        dinner: best.dinner,
        dailyTotal: best.dailyTotal,
    };
}

/**
 * Build a full week; reuses the best single-day plan on any day that
 * still misses the target (user asked for repeats when needed).
 */
function pickWeeklyMealsOptimized(bPool, lPool, dPool, dailyTarget, dayCount = 7) {
    const days = [];
    let template = null;

    for (let i = 0; i < dayCount; i++) {
        let day = pickDailyMealsOptimized(bPool, lPool, dPool, dailyTarget, {});

        if (day.dailyTotal < dailyTarget - NEAR_TARGET_GAP && template) {
            day = {
                breakfast: [...template.breakfast],
                lunch: [...template.lunch],
                dinner: [...template.dinner],
                dailyTotal: template.dailyTotal,
            };
        }

        if (!template || Math.abs(dailyTarget - day.dailyTotal) < Math.abs(dailyTarget - template.dailyTotal)) {
            template = day;
        }

        days.push(day);
    }

    return days;
}

module.exports = {
    optimizeSlot,
    pickDailyMealsOptimized,
    pickWeeklyMealsOptimized,
    NEAR_TARGET_GAP,
};
